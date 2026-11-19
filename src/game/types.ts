export type GameState = "playing" | "gameover";

export type PowerUpType = "magnet" | "jetpack" | "hoverboard";

export type ObstacleKind = "train" | "barrier";

export interface TrainObstacle {
  id: number;
  kind: ObstacleKind;
  lane: number;
  z: number;
  length: number;
  height: number;
  mesh: import("three").Group;
}

export interface CoinItem {
  id: number;
  lane: number;
  z: number;
  y: number;
  collected: boolean;
  mesh: import("three").Mesh;
}

export interface PowerUpItem {
  id: number;
  type: PowerUpType;
  lane: number;
  z: number;
  collected: boolean;
  mesh: import("three").Group;
}

export interface SceneryProp {
  z: number;
  mesh: import("three").Object3D;
}
