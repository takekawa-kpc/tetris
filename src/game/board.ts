import type { Board, Cell, CellPos, TetrominoId } from "./types";

export const COLS = 10;
export const ROWS = 20;

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
}

export function isInside(pos: CellPos): boolean {
  return pos.x >= 0 && pos.x < COLS && pos.y >= 0 && pos.y < ROWS;
}

export function isFree(board: Board, cells: CellPos[]): boolean {
  return cells.every((c) => isInside(c) && board[c.y][c.x] === null);
}

export function placeCells(board: Board, cells: CellPos[], id: TetrominoId): Board {
  const next = board.map((row) => [...row]);
  for (const c of cells) {
    if (isInside(c)) next[c.y][c.x] = id;
  }
  return next;
}
