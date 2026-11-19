import * as THREE from "three";
import { PowerUpType } from "./types";

export const LANE_WIDTH = 2.4;
export const LANES = [-1, 0, 1] as const;

export interface RunnerRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  head: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  hoverboard: THREE.Mesh;
  jetpackFlameLeft: THREE.Mesh;
  jetpackFlameRight: THREE.Mesh;
}

export function createRunnerCharacter(isInspector = false): RunnerRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const shirtColor = isInspector ? "#1e3a8a" : "#38bdf8";
  const pantsColor = isInspector ? "#0f172a" : "#2563eb";
  const skinColor = "#fbbf24";

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.95, 0.5),
    new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.45 })
  );
  torso.position.y = 1.25;
  bodyGroup.add(torso);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.68, 0.68),
    new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.4 })
  );
  head.position.y = 2.1;
  bodyGroup.add(head);

  if (isInspector) {
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.22, 0.78),
      new THREE.MeshStandardMaterial({ color: "#facc15" })
    );
    cap.position.y = 2.48;
    bodyGroup.add(cap);
  }

  const limbGeo = new THREE.BoxGeometry(0.26, 0.72, 0.28);
  const armMat = new THREE.MeshStandardMaterial({ color: skinColor });
  const legMat = new THREE.MeshStandardMaterial({ color: pantsColor });

  const leftArm = new THREE.Mesh(limbGeo, armMat);
  leftArm.position.set(-0.6, 1.22, 0);
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Mesh(limbGeo, armMat);
  rightArm.position.set(0.6, 1.22, 0);
  bodyGroup.add(rightArm);

  const leftLeg = new THREE.Mesh(limbGeo, legMat);
  leftLeg.position.set(-0.24, 0.45, 0);
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(limbGeo, legMat);
  rightLeg.position.set(0.24, 0.45, 0);
  bodyGroup.add(rightLeg);

  const hoverboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.14, 1.75),
    new THREE.MeshStandardMaterial({
      color: "#f97316",
      emissive: "#ea580c",
      emissiveIntensity: 0.35,
    })
  );
  hoverboard.position.set(0, 0.12, 0);
  hoverboard.visible = false;
  root.add(hoverboard);

  const flameGeo = new THREE.ConeGeometry(0.16, 0.65, 10);
  flameGeo.rotateX(Math.PI);
  const flameMat = new THREE.MeshBasicMaterial({ color: "#fb923c" });

  const jetpackFlameLeft = new THREE.Mesh(flameGeo, flameMat);
  jetpackFlameLeft.position.set(-0.22, 0.95, 0.34);
  jetpackFlameLeft.visible = false;
  bodyGroup.add(jetpackFlameLeft);

  const jetpackFlameRight = new THREE.Mesh(flameGeo, flameMat);
  jetpackFlameRight.position.set(0.22, 0.95, 0.34);
  jetpackFlameRight.visible = false;
  bodyGroup.add(jetpackFlameRight);

  return {
    root,
    bodyGroup,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    hoverboard,
    jetpackFlameLeft,
    jetpackFlameRight,
  };
}

export function addSubwayEnvironment(scene: THREE.Scene): void {
  scene.background = new THREE.Color("#0b132b");
  scene.fog = new THREE.Fog("#0b132b", 28, 95);

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.5, 130),
    new THREE.MeshStandardMaterial({ color: "#1c2541", roughness: 0.85 })
  );
  ground.position.set(0, -0.25, -45);
  scene.add(ground);

  const sleeperGeo = new THREE.BoxGeometry(8.5, 0.08, 0.35);
  const sleeperMat = new THREE.MeshStandardMaterial({ color: "#334155" });
  for (let z = 10; z >= -85; z -= 2.2) {
    const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
    sleeper.position.set(0, 0.02, z);
    scene.add(sleeper);
  }

  const railGeo = new THREE.BoxGeometry(0.14, 0.14, 110);
  const railMat = new THREE.MeshStandardMaterial({
    color: "#cbd5e1",
    metalness: 0.7,
    roughness: 0.25,
  });

  for (const lane of LANES) {
    const xCenter = lane * LANE_WIDTH;

    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(xCenter - 0.55, 0.08, -38);
    scene.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(xCenter + 0.55, 0.08, -38);
    scene.add(rightRail);
  }

  const wallGeo = new THREE.BoxGeometry(0.6, 8, 120);
  const wallMat = new THREE.MeshStandardMaterial({ color: "#16203a" });

  const leftWall = new THREE.Mesh(wallGeo, wallMat);
  leftWall.position.set(-5.8, 3.8, -42);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(wallGeo, wallMat);
  rightWall.position.set(5.8, 3.8, -42);
  scene.add(rightWall);
}

export function createScenerySegment(zPos: number): THREE.Group {
  const group = new THREE.Group();
  group.position.z = zPos;

  const pillarGeo = new THREE.BoxGeometry(0.55, 6.5, 0.55);
  const pillarMat = new THREE.MeshStandardMaterial({ color: "#475569" });

  const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
  leftPillar.position.set(-5.1, 3.25, 0);
  group.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
  rightPillar.position.set(5.1, 3.25, 0);
  group.add(rightPillar);

  const arch = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 0.35, 0.5),
    new THREE.MeshStandardMaterial({ color: "#334155" })
  );
  arch.position.set(0, 6.4, 0);
  group.add(arch);

  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.14, 0.35),
    new THREE.MeshBasicMaterial({ color: "#bae6fd" })
  );
  lamp.position.set(0, 6.18, 0);
  group.add(lamp);

  return group;
}

export function createTrainMesh(length = 9.5, height = 2.65): THREE.Group {
  const train = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, height, length),
    new THREE.MeshStandardMaterial({ color: "#ef4444", roughness: 0.35 })
  );
  body.position.y = height / 2;
  train.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.92, 0.18, length * 0.96),
    new THREE.MeshStandardMaterial({ color: "#e2e8f0" })
  );
  roof.position.y = height + 0.06;
  train.add(roof);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.25, length * 0.98),
    new THREE.MeshStandardMaterial({ color: "#facc15" })
  );
  stripe.position.y = height * 0.68;
  train.add(stripe);

  const frontLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.25, 0.12),
    new THREE.MeshBasicMaterial({ color: "#fef08a" })
  );
  frontLight.position.set(0, 0.9, length / 2 + 0.04);
  train.add(frontLight);

  return train;
}

export function createCoinMesh(): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(0.42, 0.42, 0.14, 18);
  geo.rotateZ(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: "#facc15",
    emissive: "#ca8a04",
    emissiveIntensity: 0.25,
    metalness: 0.65,
    roughness: 0.25,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 1.1;
  return mesh;
}

export function createPowerUpMesh(type: PowerUpType): THREE.Group {
  const group = new THREE.Group();

  const colorMap: Record<PowerUpType, string> = {
    magnet: "#ec4899",
    jetpack: "#22c55e",
    hoverboard: "#f97316",
  };

  const orb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    new THREE.MeshStandardMaterial({
      color: colorMap[type],
      emissive: colorMap[type],
      emissiveIntensity: 0.35,
      roughness: 0.25,
    })
  );
  orb.position.y = 1.25;
  group.add(orb);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.06, 10, 24),
    new THREE.MeshBasicMaterial({ color: "#f8fafc" })
  );
  ring.position.y = 1.25;
  group.add(ring);

  return group;
}
