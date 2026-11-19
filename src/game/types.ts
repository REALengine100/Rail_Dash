export type GameState = "playing" | "gameover";

export interface TrainObstacle {
  id: number;
  lane: number;
  z: number;
  length: number;
  height: number;
  mesh: import("three").Mesh;
}

export interface CoinItem {
  id: number;
  lane: number;
  z: number;
  collected: boolean;
  mesh: import("three").Mesh;
}
