export type TetrominoId = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export type Rotation = 0 | 1 | 2 | 3;

export type Board = (TetrominoId | null)[][];

export type Piece = {
  id: TetrominoId;
  x: number; // 左端の列 (0-9)
  y: number; // 上端の行 (0-19)
  rotation: Rotation; // 0° / 90° / 180° / 270°
};

export const BOARD_W = 10;
export const BOARD_H = 20;

// 各テトロミノは 4x4 のボックス内に定義し、4 回転状態をその回転で生成する。
// セルは [列, 行] のオフセット (0-3 の範囲) として保持する。
const GRID = 4;

const SHAPES_BASE: Record<TetrominoId, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [0, 0, 0, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
  ],
  T: [
    [0, 1, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  S: [
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  Z: [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  L: [
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
};

function rotateCW(grid: number[][]): number[][] {
  const n = grid.length;
  return grid.map((_, r) =>
    Array.from({ length: n }, (_, c) => grid[n - 1 - c][r])
  );
}

function toOffsets(grid: number[][]): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (grid[r][c]) cells.push([c, r]);
    }
  }
  return cells;
}

export const TETROMINO_SHAPES = Object.fromEntries(
  (Object.keys(SHAPES_BASE) as TetrominoId[]).map((id) => {
    let grid = SHAPES_BASE[id];
    const rotations: [number, number][][] = [];
    for (let i = 0; i < 4; i++) {
      rotations.push(toOffsets(grid));
      grid = rotateCW(grid);
    }
    return [id, rotations];
  })
) as Record<TetrominoId, [number, number][][]>;

const ALL_IDS: TetrominoId[] = ["I", "O", "T", "S", "Z", "J", "L"];

export function shuffle<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 7 バグ方式: 7 種をシャッフルして使い切ったら次のバグへ
export class PieceGenerator {
  private bag: TetrominoId[] = [];
  next(): TetrominoId {
    if (this.bag.length === 0) this.bag = shuffle(ALL_IDS);
    return this.bag.pop()!;
  }
}

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_H }, () =>
    Array.from({ length: BOARD_W }, () => null)
  );
}
