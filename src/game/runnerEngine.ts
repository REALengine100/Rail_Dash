import * as THREE from "three";
import { SoundEngine } from "../audio/soundEngine";
import { InputController, MoveAction } from "./inputController";
import { CoinItem, GameState, TrainObstacle } from "./types";
import {
  addTrackLanes,
  createCoinMesh,
  createTrainMesh,
  LANES,
  LANE_WIDTH,
} from "./worldBuilder";

export interface HudSnapshot {
  state: GameState;
  score: number;
  coins: number;
}

export class RunnerEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private player: THREE.Mesh;
  private sound: SoundEngine;
  private input: InputController;

  private state: GameState = "playing";
  private currentLaneIndex = 1;
  private targetX = 0;

  private vy = 0;
  private isJumping = false;
  private isSliding = false;
  private slideTimer = 0;

  private speed = 16;
  private score = 0;
  private coins = 0;

  private trains: TrainObstacle[] = [];
  private coinItems: CoinItem[] = [];
  private nextId = 1;
  private spawnTimer = 0;

  private animFrameId: number | null = null;
  private lastTime = performance.now();
  private onHudUpdate?: (hud: HudSnapshot) => void;

  constructor(
    container: HTMLElement,
    sound: SoundEngine,
    onHudUpdate?: (hud: HudSnapshot) => void
  ) {
    this.sound = sound;
    this.onHudUpdate = onHudUpdate;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#0f172a");

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      200
    );
    this.camera.position.set(0, 4.5, 8.5);
    this.camera.lookAt(0, 1.4, -4);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
    dirLight.position.set(6, 12, 8);
    this.scene.add(dirLight);

    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.4, 110),
      new THREE.MeshStandardMaterial({ color: "#1e293b" })
    );
    ground.position.set(0, -0.2, -35);
    this.scene.add(ground);

    addTrackLanes(this.scene);

    this.player = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 1.8, 1.05),
      new THREE.MeshStandardMaterial({ color: "#38bdf8" })
    );
    this.player.position.set(0, 0.9, 0);
    this.scene.add(this.player);

    this.input = new InputController(container, (action) =>
      this.handleAction(action)
    );

    window.addEventListener("resize", this.handleResize);
    this.emitHud();
    this.startLoop();
  }

  private handleResize = () => {
    const parent = this.renderer.domElement.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = Math.max(1, parent.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handleAction(action: MoveAction) {
    if (this.state !== "playing") return;

    if (action === "left") {
      this.currentLaneIndex = Math.max(0, this.currentLaneIndex - 1);
      this.targetX = LANES[this.currentLaneIndex] * LANE_WIDTH;
    } else if (action === "right") {
      this.currentLaneIndex = Math.min(2, this.currentLaneIndex + 1);
      this.targetX = LANES[this.currentLaneIndex] * LANE_WIDTH;
    } else if (action === "jump" && !this.isJumping) {
      this.isJumping = true;
      this.isSliding = false;
      this.slideTimer = 0;
      this.player.scale.y = 1;
      this.vy = 11.5;
      this.sound.playJump();
    } else if (action === "slide" && !this.isJumping) {
      this.isSliding = true;
      this.slideTimer = 0.65;
      this.player.scale.y = 0.5;
      this.player.position.y = 0.45;
    }
  }

  private spawnWave() {
    const lane = LANES[Math.floor(Math.random() * LANES.length)];
    const zPos = -75;

    if (Math.random() < 0.65) {
      const length = 9;
      const height = 2.6;
      const mesh = createTrainMesh(length, height);
      mesh.position.set(lane * LANE_WIDTH, height / 2, zPos);
      this.scene.add(mesh);

      this.trains.push({
        id: this.nextId++,
        lane,
        z: zPos,
        length,
        height,
        mesh,
      });
    }

    const coinLane = LANES[Math.floor(Math.random() * LANES.length)];
    for (let i = 0; i < 3; i++) {
      const coinZ = zPos - i * 2.2;
      const mesh = createCoinMesh();
      mesh.position.set(coinLane * LANE_WIDTH, 1.1, coinZ);
      this.scene.add(mesh);

      this.coinItems.push({
        id: this.nextId++,
        lane: coinLane,
        z: coinZ,
        collected: false,
        mesh,
      });
    }
  }

  private updatePlayer(dt: number) {
    this.player.position.x +=
      (this.targetX - this.player.position.x) * Math.min(1, dt * 16);

    if (this.isJumping) {
      this.player.position.y += this.vy * dt;
      this.vy -= 28 * dt;

      if (this.player.position.y <= 0.9) {
        this.player.position.y = 0.9;
        this.vy = 0;
        this.isJumping = false;
      }
    }

    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.player.scale.y = 1;
        this.player.position.y = 0.9;
      }
    }
  }

  private updateObstaclesAndCoins(dt: number) {
    const moveDist = this.speed * dt;
    const playerHalfW = 0.45;
    const playerHalfD = 0.45;
    const playerBottom = this.player.position.y - (this.isSliding ? 0.45 : 0.9);
    const playerTop = this.player.position.y + (this.isSliding ? 0.45 : 0.9);

    for (let i = this.trains.length - 1; i >= 0; i--) {
      const t = this.trains[i];
      t.z += moveDist;
      t.mesh.position.z = t.z;

      const trainHalfW = 0.9;
      const trainHalfD = t.length / 2;
      const withinX =
        Math.abs(this.player.position.x - t.mesh.position.x) <
        playerHalfW + trainHalfW;
      const withinZ = Math.abs(t.z) < playerHalfD + trainHalfD;
      const withinY = playerBottom < t.height && playerTop > 0.05;

      if (withinX && withinZ && withinY) {
        this.state = "gameover";
        this.emitHud();
        return;
      }

      if (t.z > 14) {
        this.scene.remove(t.mesh);
        this.trains.splice(i, 1);
      }
    }

    for (let i = this.coinItems.length - 1; i >= 0; i--) {
      const c = this.coinItems[i];
      c.z += moveDist;
      c.mesh.position.z = c.z;
      c.mesh.rotation.x += 4 * dt;

      if (!c.collected) {
        const dx = Math.abs(this.player.position.x - c.mesh.position.x);
        const dz = Math.abs(c.z);
        const dy = Math.abs(this.player.position.y - c.mesh.position.y);

        if (dx < 1.0 && dz < 1.0 && dy < 1.3) {
          c.collected = true;
          this.coins += 1;
          this.score += 10;
          this.sound.playCoin();
          this.scene.remove(c.mesh);
          this.coinItems.splice(i, 1);
          this.emitHud();
          continue;
        }
      }

      if (c.z > 14) {
        this.scene.remove(c.mesh);
        this.coinItems.splice(i, 1);
      }
    }
  }

  private emitHud() {
    if (this.onHudUpdate) {
      this.onHudUpdate({
        state: this.state,
        score: Math.floor(this.score),
        coins: this.coins,
      });
    }
  }

  private startLoop() {
    const step = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;

      if (this.state === "playing") {
        this.speed = Math.min(34, this.speed + 0.25 * dt);
        this.score += this.speed * dt;

        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnWave();
          this.spawnTimer = Math.max(0.85, 1.55 - (this.speed - 16) * 0.03);
        }

        this.updatePlayer(dt);
        this.updateObstaclesAndCoins(dt);
        this.emitHud();
      }

      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(step);
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  public restart() {
    for (const t of this.trains) this.scene.remove(t.mesh);
    for (const c of this.coinItems) this.scene.remove(c.mesh);
    this.trains = [];
    this.coinItems = [];

    this.state = "playing";
    this.currentLaneIndex = 1;
    this.targetX = 0;
    this.player.position.set(0, 0.9, 0);
    this.player.scale.set(1, 1, 1);
    this.vy = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.speed = 16;
    this.score = 0;
    this.coins = 0;
    this.spawnTimer = 0.4;
    this.emitHud();
  }

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener("resize", this.handleResize);
    const parent = this.renderer.domElement.parentElement;
    if (parent) {
      this.input.dispose(parent);
      parent.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
