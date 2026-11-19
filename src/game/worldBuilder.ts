import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PowerUpType } from "./types";

export const LANE_WIDTH = 2.4;
export const LANES = [-1, 0, 1] as const;

export interface RunnerRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  hoverboard: THREE.Mesh;
  jetpackFlameLeft: THREE.Mesh;
  jetpackFlameRight: THREE.Mesh;
}

export function createRunnerCharacter(isInspector = false): RunnerRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const jacketColor = isInspector ? "#1e3a8a" : "#0ea5e9";
  const jacketTrim = isInspector ? "#facc15" : "#f97316";
  const pantsColor = isInspector ? "#0f172a" : "#1d4ed8";
  const shoeColor = isInspector ? "#f8fafc" : "#ef4444";
  const skinColor = "#f59e0b";
  const hairColor = isInspector ? "#475569" : "#1e1b4b";

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.2, 0.44),
    new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.5 })
  );
  belt.position.y = 0.86;
  bodyGroup.add(belt);

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.86, 0.48),
    new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.4 })
  );
  torso.position.y = 1.35;
  bodyGroup.add(torso);

  const chestStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.82, 0.5),
    new THREE.MeshStandardMaterial({ color: jacketTrim, roughness: 0.35 })
  );
  chestStripe.position.set(0, 1.35, 0.01);
  bodyGroup.add(chestStripe);

  const collar = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.16, 0.52),
    new THREE.MeshStandardMaterial({ color: jacketTrim, roughness: 0.4 })
  );
  collar.position.set(0, 1.8, 0);
  bodyGroup.add(collar);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.88, 0);
  bodyGroup.add(headGroup);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.66, 0.64),
    new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.42 })
  );
  head.position.y = 0.34;
  headGroup.add(head);

  const eyeGeo = new THREE.BoxGeometry(0.11, 0.1, 0.05);
  const eyeMat = new THREE.MeshBasicMaterial({ color: "#0f172a" });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.15, 0.38, -0.33);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.15, 0.38, -0.33);
  headGroup.add(rightEye);

  if (isInspector) {
    const capBrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.08, 0.86),
      new THREE.MeshStandardMaterial({ color: "#facc15" })
    );
    capBrim.position.set(0, 0.65, -0.08);
    headGroup.add(capBrim);

    const capTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.24, 0.7),
      new THREE.MeshStandardMaterial({ color: "#eab308" })
    );
    capTop.position.set(0, 0.76, 0);
    headGroup.add(capTop);
  } else {
    const hairTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.22, 0.68),
      new THREE.MeshStandardMaterial({ color: hairColor })
    );
    hairTop.position.set(0, 0.72, 0.02);
    headGroup.add(hairTop);

    const hairSpike = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.16, 0.35),
      new THREE.MeshStandardMaterial({ color: "#f97316" })
    );
    hairSpike.position.set(0, 0.84, -0.06);
    headGroup.add(hairSpike);

    const earCupGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12);
    earCupGeo.rotateZ(Math.PI / 2);
    const earCupMat = new THREE.MeshStandardMaterial({ color: "#22c55e" });

    const leftCup = new THREE.Mesh(earCupGeo, earCupMat);
    leftCup.position.set(-0.38, 0.36, 0);
    headGroup.add(leftCup);

    const rightCup = new THREE.Mesh(earCupGeo, earCupMat);
    rightCup.position.set(0.38, 0.36, 0);
    headGroup.add(rightCup);
  }

  const createArm = (side: -1 | 1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.54, 1.66, 0);

    const sleeve = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.38, 0.24),
      new THREE.MeshStandardMaterial({ color: jacketColor })
    );
    sleeve.position.y = -0.18;
    pivot.add(sleeve);

    const forearm = new THREE.Mesh(
      new THREE.BoxGeometry(0.21, 0.32, 0.21),
      new THREE.MeshStandardMaterial({ color: skinColor })
    );
    forearm.position.y = -0.5;
    pivot.add(forearm);

    return pivot;
  };

  const leftArmPivot = createArm(-1);
  const rightArmPivot = createArm(1);
  bodyGroup.add(leftArmPivot);
  bodyGroup.add(rightArmPivot);

  const createLeg = (side: -1 | 1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.22, 0.82, 0);

    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.64, 0.28),
      new THREE.MeshStandardMaterial({ color: pantsColor })
    );
    leg.position.y = -0.32;
    pivot.add(leg);

    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.2, 0.44),
      new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.35 })
    );
    shoe.position.set(0, -0.7, -0.07);
    pivot.add(shoe);

    return pivot;
  };

  const leftLegPivot = createLeg(-1);
  const rightLegPivot = createLeg(1);
  bodyGroup.add(leftLegPivot);
  bodyGroup.add(rightLegPivot);

  const hoverboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.14, 1.8),
    new THREE.MeshStandardMaterial({
      color: "#f97316",
      emissive: "#ea580c",
      emissiveIntensity: 0.4,
    })
  );
  hoverboard.position.set(0, 0.08, 0);
  hoverboard.visible = false;
  root.add(hoverboard);

  const flameGeo = new THREE.ConeGeometry(0.16, 0.65, 10);
  flameGeo.rotateX(Math.PI);
  const flameMat = new THREE.MeshBasicMaterial({ color: "#fb923c" });

  const jetpackFlameLeft = new THREE.Mesh(flameGeo, flameMat);
  jetpackFlameLeft.position.set(-0.22, 1.05, 0.34);
  jetpackFlameLeft.visible = false;
  bodyGroup.add(jetpackFlameLeft);

  const jetpackFlameRight = new THREE.Mesh(flameGeo, flameMat);
  jetpackFlameRight.position.set(0.22, 1.05, 0.34);
  jetpackFlameRight.visible = false;
  bodyGroup.add(jetpackFlameRight);

  return {
    root,
    bodyGroup,
    headGroup,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    hoverboard,
    jetpackFlameLeft,
    jetpackFlameRight,
  };
}

export function tryLoadExternalCharacterModel(
  rig: RunnerRig,
  modelUrl = "./models/runner.glb"
): void {
  const loader = new GLTFLoader();
  loader.load(
    modelUrl,
    (gltf) => {
      while (rig.bodyGroup.children.length > 0) {
        rig.bodyGroup.remove(rig.bodyGroup.children[0]);
      }
      const model = gltf.scene;
      model.scale.set(1.1, 1.1, 1.1);
      rig.bodyGroup.add(model);
    },
    undefined,
    () => {
      // Keep stylized built-in character if no external .glb model is present
    }
  );
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

export function createTrainMesh(length = 10.5, height = 1.65): THREE.Group {
  const train = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, height, length),
    new THREE.MeshStandardMaterial({ color: "#ef4444", roughness: 0.35 })
  );
  body.position.y = height / 2;
  train.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.94, 0.16, length * 0.98),
    new THREE.MeshStandardMaterial({ color: "#e2e8f0" })
  );
  roof.position.y = height + 0.04;
  train.add(roof);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.22, length * 0.98),
    new THREE.MeshStandardMaterial({ color: "#facc15" })
  );
  stripe.position.y = height * 0.65;
  train.add(stripe);

  const frontLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.22, 0.12),
    new THREE.MeshBasicMaterial({ color: "#fef08a" })
  );
  frontLight.position.set(0, 0.75, length / 2 + 0.04);
  train.add(frontLight);

  return train;
}

export function createBarrierMesh(height = 1.05): THREE.Group {
  const barrier = new THREE.Group();

  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.32, 0.32),
    new THREE.MeshStandardMaterial({ color: "#f97316", roughness: 0.4 })
  );
  beam.position.y = height - 0.16;
  barrier.add(beam);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.84, 0.12, 0.36),
    new THREE.MeshBasicMaterial({ color: "#fef08a" })
  );
  stripe.position.y = height - 0.16;
  barrier.add(stripe);

  const postGeo = new THREE.BoxGeometry(0.16, height, 0.2);
  const postMat = new THREE.MeshStandardMaterial({ color: "#334155" });

  const leftPost = new THREE.Mesh(postGeo, postMat);
  leftPost.position.set(-0.72, height / 2, 0);
  barrier.add(leftPost);

  const rightPost = new THREE.Mesh(postGeo, postMat);
  rightPost.position.set(0.72, height / 2, 0);
  barrier.add(rightPost);

  return barrier;
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
