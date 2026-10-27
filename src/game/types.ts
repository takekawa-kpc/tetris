export type TetrominoId = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Cell = TetrominoId | null;
export type Board = Cell[][];
export type Rotation = 0 | 1 | 2 | 3;

export type Piece = {
  id: TetrominoId;
  x: number;
  y: number;
  rotation: Rotation;
};

export type GameState = "ready" | "playing" | "paused" | "gameover";

export type CellPos = { x: number; y: number };
