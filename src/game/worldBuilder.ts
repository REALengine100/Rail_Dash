import * as THREE from "three";

export const LANE_WIDTH = 2.4;
export const LANES = [-1, 0, 1] as const;

export function addTrackLanes(scene: THREE.Scene): void {
  const railGeo = new THREE.BoxGeometry(0.14, 0.12, 90);
  const railMat = new THREE.MeshStandardMaterial({ color: "#94a3b8" });

  for (const lane of LANES) {
    const xCenter = lane * LANE_WIDTH;

    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(xCenter - 0.55, 0.04, -30);
    scene.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(xCenter + 0.55, 0.04, -30);
    scene.add(rightRail);
  }
}

export function createTrainMesh(length = 9, height = 2.6): THREE.Mesh {
  const geo = new THREE.BoxGeometry(1.8, height, length);
  const mat = new THREE.MeshStandardMaterial({
    color: "#ef4444",
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height / 2;
  return mesh;
}

export function createCoinMesh(): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(0.45, 0.45, 0.14, 20);
  geo.rotateZ(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: "#facc15",
    metalness: 0.6,
    roughness: 0.25,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 1.1;
  return mesh;
}
