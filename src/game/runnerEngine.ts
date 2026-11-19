import * as THREE from "three";
import { SoundEngine } from "../audio/soundEngine";
import { InputController, MoveAction } from "./inputController";
import {
  CoinItem,
  GameState,
  PowerUpItem,
  PowerUpType,
  SceneryProp,
  TrainObstacle,
} from "./types";
import {
  addSubwayEnvironment,
  createBarrierMesh,
  createCoinMesh,
  createPowerUpMesh,
  createRunnerCharacter,
  createScenerySegment,
  createTrainMesh,
  LANES,
  LANE_WIDTH,
  RunnerRig,
  tryLoadExternalCharacterModel,
} from "./worldBuilder";

export interface HudSnapshot {
  state: GameState;
  score: number;
  coins: number;
  activePowerUp: PowerUpType | null;
  powerUpSecondsLeft: number;
}

export class RunnerEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private player: RunnerRig;
  private inspector: RunnerRig;
  private sound: SoundEngine;
  private input: InputController;

  private state: GameState = "playing";
  private currentLaneIndex = 1;
  private targetX = 0;

  private vy = 0;
  private groundY = 0;
  private isGrounded = true;
  private isSliding = false;
  private slideTimer = 0;
  private runCycle = 0;

  private activePowerUp: PowerUpType | null = null;
  private powerUpTimer = 0;
  private stumbleTimer = 0;

  private speed = 17;
  private score = 0;
  private coins = 0;

  private trains: TrainObstacle[] = [];
  private coinItems: CoinItem[] = [];
  private powerUps: PowerUpItem[] = [];
  private scenery: SceneryProp[] = [];
  private nextId = 1;
  private spawnTimer = 0.4;

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
    this.camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      180
    );
    this.camera.position.set(0, 5.4, 10.2);
    this.camera.lookAt(0, 1.5, -5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.35);
    dirLight.position.set(7, 14, 9);
    this.scene.add(dirLight);

    addSubwayEnvironment(this.scene);

    for (let z = 12; z >= -84; z -= 16) {
      const seg = createScenerySegment(z);
      this.scene.add(seg);
      this.scenery.push({ z, mesh: seg });
    }

    this.player = createRunnerCharacter(false);
    this.player.root.position.set(0, 0, 0);
    this.scene.add(this.player.root);
    tryLoadExternalCharacterModel(this.player, "./models/runner.glb");

    this.inspector = createRunnerCharacter(true);
    this.inspector.root.position.set(0, 0, 1.8);
    this.scene.add(this.inspector.root);

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
    } else if (action === "jump" && this.activePowerUp !== "jetpack") {
      if (this.isGrounded) {
        this.isGrounded = false;
        this.isSliding = false;
        this.slideTimer = 0;
        this.player.bodyGroup.scale.y = 1;
        this.vy = 13.5;
        this.sound.playJump();
      }
    } else if (action === "slide" && this.activePowerUp !== "jetpack") {
      if (!this.isGrounded) {
        // Subway Surfers fast-fall when swiping down mid-air
        this.vy = -22;
      }
      this.isSliding = true;
      this.slideTimer = 0.65;
      this.player.bodyGroup.scale.y = 0.52;
      this.sound.playSlide();
    }
  }

  private activatePowerUp(type: PowerUpType) {
    this.activePowerUp = type;
    this.powerUpTimer = type === "jetpack" ? 5.5 : 8.0;
    this.isSliding = false;
    this.player.bodyGroup.scale.y = 1;
    this.sound.playPowerUp();

    this.player.hoverboard.visible = type === "hoverboard";
    const isJetpack = type === "jetpack";
    this.player.jetpackFlameLeft.visible = isJetpack;
    this.player.jetpackFlameRight.visible = isJetpack;
  }

  private clearPowerUp() {
    this.activePowerUp = null;
    this.powerUpTimer = 0;
    this.player.hoverboard.visible = false;
    this.player.jetpackFlameLeft.visible = false;
    this.player.jetpackFlameRight.visible = false;
  }

  private spawnWave() {
    const lane = LANES[Math.floor(Math.random() * LANES.length)];
    const zPos = -78;

    if (this.activePowerUp !== "jetpack" && Math.random() < 0.72) {
      const spawnTrain = Math.random() < 0.65;
      if (spawnTrain) {
        const length = 10.5;
        const height = 1.65;
        const mesh = createTrainMesh(length, height);
        mesh.position.set(lane * LANE_WIDTH, 0, zPos);
        this.scene.add(mesh);

        this.trains.push({
          id: this.nextId++,
          kind: "train",
          lane,
          z: zPos,
          length,
          height,
          mesh,
        });
      } else {
        const length = 0.5;
        const height = 1.05;
        const mesh = createBarrierMesh(height);
        mesh.position.set(lane * LANE_WIDTH, 0, zPos);
        this.scene.add(mesh);

        this.trains.push({
          id: this.nextId++,
          kind: "barrier",
          lane,
          z: zPos,
          length,
          height,
          mesh,
        });
      }
    }

    const coinLane = LANES[Math.floor(Math.random() * LANES.length)];
    const coinY = this.activePowerUp === "jetpack" ? 4.2 : 1.1;
    for (let i = 0; i < 4; i++) {
      const coinZ = zPos - i * 2.2;
      const mesh = createCoinMesh();
      mesh.position.set(coinLane * LANE_WIDTH, coinY, coinZ);
      this.scene.add(mesh);

      const coinItem: CoinItem = {
        id: this.nextId++,
        lane: coinLane,
        z: coinZ,
        y: coinY,
        collected: false,
        mesh,
      };
      this.coinItems.push(coinItem);
    }

    if (Math.random() < 0.25) {
      const types: PowerUpType[] = ["magnet", "jetpack", "hoverboard"];
      const pType = types[Math.floor(Math.random() * types.length)];
      const pLane = LANES[Math.floor(Math.random() * LANES.length)];
      const pMesh = createPowerUpMesh(pType);
      pMesh.position.set(pLane * LANE_WIDTH, 0.2, zPos - 5);
      this.scene.add(pMesh);

      this.powerUps.push({
        id: this.nextId++,
        type: pType,
        lane: pLane,
        z: zPos - 5,
        collected: false,
        mesh: pMesh,
      });
    }
  }

  private animateRig(rig: RunnerRig, dt: number, flying: boolean) {
    this.runCycle += dt * (this.speed * 0.82);
    const swing = flying ? 0.35 : Math.sin(this.runCycle) * 0.72;

    rig.leftArmPivot.rotation.x = swing;
    rig.rightArmPivot.rotation.x = -swing;
    rig.leftLegPivot.rotation.x = flying ? -0.28 : -swing;
    rig.rightLegPivot.rotation.x = flying ? -0.28 : swing;
    rig.headGroup.rotation.x = flying
      ? -0.15
      : Math.abs(Math.sin(this.runCycle)) * 0.06;
    rig.bodyGroup.position.y = flying
      ? 0.08
      : Math.abs(Math.cos(this.runCycle)) * 0.07;
  }

  private updatePlayerAndInspector(dt: number) {
    const laneDiff = this.targetX - this.player.root.position.x;
    this.player.root.position.x += laneDiff * Math.min(1, dt * 20);
    this.player.bodyGroup.rotation.z = -laneDiff * 0.14;

    if (this.activePowerUp) {
      this.powerUpTimer -= dt;
      if (this.powerUpTimer <= 0) {
        this.clearPowerUp();
      }
    }

    if (this.activePowerUp === "jetpack") {
      this.groundY = 0;
      this.isGrounded = false;
      this.vy = 0;
      this.player.root.position.y +=
        (4.2 - this.player.root.position.y) * Math.min(1, dt * 8);
      const flicker = 0.85 + Math.random() * 0.45;
      this.player.jetpackFlameLeft.scale.set(1, flicker, 1);
      this.player.jetpackFlameRight.scale.set(1, flicker, 1);
    } else {
      if (!this.isGrounded) {
        this.player.root.position.y += this.vy * dt;
        this.vy -= 28 * dt;
      }

      if (this.player.root.position.y <= this.groundY) {
        this.player.root.position.y = this.groundY;
        this.vy = 0;
        this.isGrounded = true;
      } else if (this.player.root.position.y > this.groundY + 0.05) {
        this.isGrounded = false;
      }
    }

    if (this.isSliding && this.activePowerUp !== "jetpack") {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.player.bodyGroup.scale.y = 1;
      }
    }

    this.animateRig(
      this.player,
      dt,
      this.activePowerUp === "jetpack" || !this.isGrounded
    );

    if (this.stumbleTimer > 0) {
      this.stumbleTimer -= dt;
    }

    const desiredInspectorZ = this.stumbleTimer > 0 ? 1.15 : 1.8;
    this.inspector.root.position.x +=
      (this.player.root.position.x - this.inspector.root.position.x) *
      Math.min(1, dt * 12);
    this.inspector.root.position.z +=
      (desiredInspectorZ - this.inspector.root.position.z) * Math.min(1, dt * 6);
    this.inspector.root.position.y = Math.max(
      0,
      this.player.root.position.y * 0.45
    );
    this.animateRig(this.inspector, dt, false);
  }

  private updateSceneryAndEntities(dt: number) {
    const moveDist = this.speed * dt;

    for (const seg of this.scenery) {
      seg.z += moveDist;
      if (seg.z > 16) {
        seg.z -= 96;
      }
      seg.mesh.position.z = seg.z;
    }

    const playerX = this.player.root.position.x;
    const playerY = this.player.root.position.y;
    const playerBottom = playerY;
    const playerTop = playerY + (this.isSliding ? 1.0 : 1.95);

    let supportHeight = 0;

    for (let i = this.trains.length - 1; i >= 0; i--) {
      const t = this.trains[i];
      t.z += moveDist;
      t.mesh.position.z = t.z;

      if (this.activePowerUp !== "jetpack") {
        const withinX = Math.abs(playerX - t.mesh.position.x) < 1.02;
        const withinZ = Math.abs(t.z) < 0.35 + t.length / 2;

        if (withinX && withinZ) {
          // Run on top of train roof if player is above/landing on it
          if (
            t.kind === "train" &&
            playerBottom >= t.height - 0.32 &&
            this.vy <= 0
          ) {
            supportHeight = Math.max(supportHeight, t.height);
          } else if (playerBottom < t.height - 0.15 && playerTop > 0.15) {
            if (this.activePowerUp === "hoverboard") {
              this.clearPowerUp();
              this.stumbleTimer = 2.0;
              this.scene.remove(t.mesh);
              this.trains.splice(i, 1);
              continue;
            } else {
              this.state = "gameover";
              this.sound.playGameOver();
              this.emitHud();
              return;
            }
          }
        }
      }

      if (t.z > 14) {
        this.scene.remove(t.mesh);
        this.trains.splice(i, 1);
      }
    }

    if (this.activePowerUp !== "jetpack") {
      if (supportHeight > 0) {
        this.groundY = supportHeight;
        if (this.player.root.position.y < supportHeight) {
          this.player.root.position.y = supportHeight;
          this.vy = 0;
          this.isGrounded = true;
        }
      } else if (this.groundY > 0) {
        this.groundY = 0;
        this.isGrounded = false;
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.z += moveDist;
      p.mesh.position.z = p.z;
      p.mesh.rotation.y += 3 * dt;

      if (!p.collected) {
        const dx = Math.abs(playerX - p.mesh.position.x);
        const dz = Math.abs(p.z);
        const dy = Math.abs(playerY + 1.0 - 1.25);

        if (dx < 1.15 && dz < 1.15 && dy < 1.6) {
          p.collected = true;
          this.activatePowerUp(p.type);
          this.scene.remove(p.mesh);
          this.powerUps.splice(i, 1);
          continue;
        }
      }

      if (p.z > 14) {
        this.scene.remove(p.mesh);
        this.powerUps.splice(i, 1);
      }
    }

    for (let i = this.coinItems.length - 1; i >= 0; i--) {
      const c = this.coinItems[i];
      c.z += moveDist;

      if (
        !c.collected &&
        this.activePowerUp === "magnet" &&
        c.z > -28 &&
        c.z < 12
      ) {
        c.mesh.position.x +=
          (playerX - c.mesh.position.x) * Math.min(1, dt * 12);
        c.mesh.position.y +=
          (playerY + 1.1 - c.mesh.position.y) * Math.min(1, dt * 12);
      } else {
        c.mesh.position.x +=
          (c.lane * LANE_WIDTH - c.mesh.position.x) * Math.min(1, dt * 10);
        c.mesh.position.y = c.y;
      }

      c.mesh.position.z = c.z;
      c.mesh.rotation.x += 4.5 * dt;

      if (!c.collected) {
        const dx = Math.abs(playerX - c.mesh.position.x);
        const dz = Math.abs(c.z);
        const dy = Math.abs(playerY + 1.1 - c.mesh.position.y);

        if (dx < 1.15 && dz < 1.15 && dy < 1.5) {
          c.collected = true;
          this.coins += 1;
          this.score += 10;
          this.sound.playCoin();
          this.scene.remove(c.mesh);
          this.coinItems.splice(i, 1);
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
        activePowerUp: this.activePowerUp,
        powerUpSecondsLeft: Math.max(0, Math.ceil(this.powerUpTimer)),
      });
    }
  }

  private startLoop() {
    const step = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;

      if (this.state === "playing") {
        const mult = this.activePowerUp === "jetpack" ? 1.35 : 1;
        this.speed = Math.min(35, this.speed + 0.25 * dt);
        this.score += this.speed * dt * mult;

        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnWave();
          this.spawnTimer = Math.max(0.8, 1.5 - (this.speed - 17) * 0.03);
        }

        this.updatePlayerAndInspector(dt);
        this.updateSceneryAndEntities(dt);
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
    for (const p of this.powerUps) this.scene.remove(p.mesh);
    this.trains = [];
    this.coinItems = [];
    this.powerUps = [];

    this.clearPowerUp();
    this.stumbleTimer = 0;
    this.groundY = 0;

    this.state = "playing";
    this.currentLaneIndex = 1;
    this.targetX = 0;
    this.player.root.position.set(0, 0, 0);
    this.player.bodyGroup.scale.set(1, 1, 1);
    this.player.bodyGroup.rotation.z = 0;
    this.inspector.root.position.set(0, 0, 1.8);

    this.vy = 0;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.speed = 17;
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
