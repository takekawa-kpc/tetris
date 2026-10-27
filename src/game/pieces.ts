import { COLS } from "./board";
import type { CellPos, Piece, Rotation, TetrominoId } from "./types";

export type Offset = [row: number, col: number];

export const TETROMINO_IDS: readonly TetrominoId[] = ["I", "O", "T", "S", "Z", "J", "L"];

export const BOX_SIZE: Record<TetrominoId, number> = {
  I: 4,
  O: 2,
  T: 3,
  S: 3,
  Z: 3,
  J: 3,
  L: 3,
};

export const SHAPES_0: Record<TetrominoId, readonly Offset[]> = {
  I: [[1, 0], [1, 1], [1, 2], [1, 3]],
  O: [[0, 0], [0, 1], [1, 0], [1, 1]],
  T: [[0, 1], [1, 0], [1, 1], [1, 2]],
  S: [[0, 1], [0, 2], [1, 0], [1, 1]],
  Z: [[0, 0], [0, 1], [1, 1], [1, 2]],
  J: [[0, 0], [1, 0], [1, 1], [1, 2]],
  L: [[0, 2], [1, 0], [1, 1], [1, 2]],
};

export const COLORS: Record<TetrominoId, string> = {
  I: "#00c7d4",
  O: "#ffc21c",
  T: "#9b5de2",
  S: "#1fb852",
  Z: "#e23a4e",
  J: "#2f6fed",
  L: "#f07b1f",
};

export function spawnX(id: TetrominoId): number {
  return Math.floor((COLS - BOX_SIZE[id]) / 2);
}

export function spawnPiece(id: TetrominoId): Piece {
  return { id, x: spawnX(id), y: 0, rotation: 0 };
}

export function shapeOffsets(id: TetrominoId, rotation: Rotation): Offset[] {
  const box = BOX_SIZE[id];
  const offsets: Offset[] = SHAPES_0[id].map(([row, col]) => [row, col]);
  for (let i = 0; i < rotation; i++) {
    for (let j = 0; j < offsets.length; j++) {
      const [row, col] = offsets[j];
      offsets[j] = [col, box - 1 - row];
    }
  }
  return offsets;
}

export function pieceCells(piece: Piece): CellPos[] {
  return shapeOffsets(piece.id, piece.rotation).map(([row, col]) => ({
    x: piece.x + col,
    y: piece.y + row,
  }));
}
