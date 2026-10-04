export type TetrominoId = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export type Board = (TetrominoId | null)[][];

export type Piece = {
  id: TetrominoId;
  x: number;
  y: number;
  rotation: 0 | 1 | 2 | 3;
};

// 各ピースの形状を簡易的に定義（実際の座標は省略）
const dummyRotation: [number, number][] = [[0, 0], [0, 0], [0, 0], [0, 0]];

export const TETROMINO_SHAPES = {
  I: [dummyRotation, dummyRotation, dummyRotation, dummyRotation],
  O: [dummyRotation, dummyRotation, dummyRotation, dummyRotation],
  T: [dummyRotation, dummyRotation, dummyRotation, dummyRotation],
  S: [dummyRotation, dummyRotation, dummyRotation, dummyRotation],
  Z: [dummyRotation, dummyRotation, dummyRotation, dummyRotation],
  J: [dummyRotation, dummyRotation, dummyRotation, dummyRotation],
  L: [dummyRotation, dummyRotation, dummyRotation, dummyRotation],
};

const ALL_IDS: TetrominoId[] = ["I", "O", "T", "S", "Z", "J", "L"];

export class PieceGenerator {
  private bag: TetrominoId[] = [];
  next(): TetrominoId {
    if (this.bag.length === 0) {
      this.bag = shuffle([...ALL_IDS]);
    }
    return this.bag.pop()!;
  }
}

function shuffle<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createEmptyBoard(): Board {
  const board: Board = Array.from({ length: 20 }, () => Array.from({ length: 10 }, () => null));
  return board;
}
