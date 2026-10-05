import {
  TETROMINO_SHAPES,
  PieceGenerator,
  createEmptyBoard,
  BOARD_W,
  BOARD_H,
} from './tetromino';
import type { Piece, Board, TetrominoId, Rotation } from './tetromino';

export type GameState = {
  board: Board;
  piece: Piece; // 現在落下中のピース
  nextPiece: Piece; // 次のピース
  isOver: boolean;
  score: number;
  lines: number;
  level: number;
};

// 盤面上部の中央(幅 10 に対して)から出現させる位置
const SPAWN_X = 3;
const SPAWN_Y = 0;

// spec §2.5: 消し行数 × レベル による加算ポイント
const LINE_SCORES = [0, 40, 100, 300, 1200];

export function spawn(id: TetrominoId): Piece {
  return { id, x: SPAWN_X, y: SPAWN_Y, rotation: 0 };
}

export function createInitialState(): GameState {
  const gen = new PieceGenerator();
  return {
    board: createEmptyBoard(),
    piece: spawn(gen.next()),
    nextPiece: spawn(gen.next()),
    isOver: false,
    score: 0,
    lines: 0,
    level: 1,
  };
}

// spec §2.5: max(100, round(800 × 0.85^(level - 1)))
export function dropIntervalMs(level: number): number {
  return Math.max(100, Math.round(800 * Math.pow(0.85, level - 1)));
}

export function scoreForClear(cleared: number, level: number): number {
  return (LINE_SCORES[cleared] ?? 0) * level;
}

// ピースが占める盤面絶対座標(セル)のリスト
export function pieceCells(piece: Piece): { col: number; row: number }[] {
  return TETROMINO_SHAPES[piece.id][piece.rotation].map(([c, r]) => ({
    col: piece.x + c,
    row: piece.y + r,
  }));
}

// 盤面外・固定セルとの衝突判定
export function collides(board: Board, piece: Piece): boolean {
  for (const { col, row } of pieceCells(piece)) {
    if (col < 0 || col >= BOARD_W || row >= BOARD_H) return true;
    if (row >= 0 && board[row][col] !== null) return true;
  }
  return false;
}

// dx/dy の移動 + rotationDelta の回転を適用。衝突すれば null を返す。
export function movePiece(
  state: GameState,
  dx: number,
  dy: number,
  rotationDelta: number
): GameState | null {
  if (state.isOver) return null;
  const rotation = ((((state.piece.rotation + rotationDelta) % 4) + 4) % 4) as Rotation;
  const moved: Piece = {
    ...state.piece,
    x: state.piece.x + dx,
    y: state.piece.y + dy,
    rotation,
  };
  if (collides(state.board, moved)) return null;
  return { ...state, piece: moved };
}

// 移動（dx/dy）のみ。衝突・ゲームオーバー時は null。
export function move(state: GameState, dx: number, dy: number): GameState | null {
  return movePiece(state, dx, dy, 0);
}

// 回転。dir: +1 = 時計回り / -1 = 反時計回り。衝突時は null。
export function rotate(state: GameState, dir: 1 | -1 = 1): GameState | null {
  return movePiece(state, 0, 0, dir);
}

// ピースを固定し、ライン消し・スコア・レベルを更新、次のピースへ移行する
export function lockPiece(state: GameState): GameState {
  const board = state.board.map((row) => row.slice());
  for (const { col, row } of pieceCells(state.piece)) {
    if (row >= 0 && row < BOARD_H && col >= 0 && col < BOARD_W) {
      board[row][col] = state.piece.id;
    }
  }

  // ライン消し
  const remaining = board.filter((row) => row.some((cell) => cell === null));
  const cleared = BOARD_H - remaining.length;
  const freshRows: (TetrominoId | null)[][] = Array.from({ length: cleared }, () =>
    Array.from({ length: BOARD_W }, () => null)
  );
  const newBoard = freshRows.concat(remaining);

  const lines = state.lines + cleared;
  const level = Math.min(15, Math.floor(lines / 10) + 1);
  const score = state.score + scoreForClear(cleared, state.level);

  // 次のピースへ移行
  const gen = new PieceGenerator();
  const newPiece = { ...state.nextPiece };
  const newNext = spawn(gen.next());
  const isOver = collides(newBoard, newPiece);

  return {
    board: newBoard,
    piece: newPiece,
    nextPiece: newNext,
    isOver,
    score,
    lines,
    level,
  };
}

// ソフトドロップ (↓): 1 セル下へ移動し 1 点加算。動けなければ無変更（得点なし）。
export function softDrop(state: GameState): GameState {
  if (state.isOver) return state;
  const moved = move(state, 0, 1);
  if (!moved) return state;
  return { ...moved, score: moved.score + 1 };
}

// ハードドロップ (Space): 着地位置まで落下してロック、落下セル数 × 2 点加算。
export function hardDrop(state: GameState): GameState {
  if (state.isOver) return state;
  let cur = state;
  let dropped = 0;
  for (;;) {
    const next = move(cur, 0, 1);
    if (!next) break;
    cur = next;
    dropped++;
  }
  const locked = lockPiece(cur);
  return { ...locked, score: locked.score + dropped * 2 };
}

// ゲームオーバー: 新しいピースが出現位置で既存セルと衝突している状態
export function isGameOver(state: GameState): boolean {
  return state.isOver || collides(state.board, state.piece);
}
