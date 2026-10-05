import { test, expect } from '@playwright/test';
import {
  createInitialState,
  movePiece,
  lockPiece,
  completeLock,
  isGameOver,
  dropIntervalMs,
  scoreForClear,
  type GameState,
} from '../src/game';
import { createEmptyBoard } from '../src/tetromino';

// Helper: 盤面に満行があるか
const hasFullRow = (board: (string | null)[][]) =>
  board.some((row) => row.every((cell) => cell !== null));

test('初期状態', () => {
  const s = createInitialState();
  expect(s.board.length).toBe(20);
  expect(s.board[0].length).toBe(10);
  expect(s.piece).not.toBeNull();
  expect(s.nextPiece).not.toBeNull();
  expect(s.isOver).toBe(false);
  expect(s.score).toBe(0);
  expect(s.lines).toBe(0);
  expect(s.level).toBe(1);
});

test('重力で 1 行下方へ落下する', () => {
  const s = createInitialState();
  const next = movePiece(s, 0, 1, 0);
  expect(next).not.toBeNull();
  expect(next!.piece.y).toBe(s.piece.y + 1);
});

test('左右に 1 セル移動する', () => {
  const s = createInitialState();
  expect(movePiece(s, -1, 0, 0)!.piece.x).toBe(s.piece.x - 1);
  expect(movePiece(s, 1, 0, 0)!.piece.x).toBe(s.piece.x + 1);
});

test('時計回りに 90° 回転する', () => {
  const s = createInitialState();
  const next = movePiece(s, 0, 0, 1);
  expect(next).not.toBeNull();
  expect(next!.piece.rotation).toBe((s.piece.rotation + 1) % 4);
});

test('盤面外への移動は拒否される', () => {
  let s = createInitialState();
  for (let i = 0; i < 30; i++) {
    const n = movePiece(s, -1, 0, 0);
    if (!n) break;
    s = n;
  }
  expect(movePiece(s, -1, 0, 0)).toBeNull();
});

test('固定セルとの衝突で移動が拒否される', () => {
  const s = createInitialState();
  const blocked = s.board.map((row) => row.slice());
  // ピースの真下をすべて埋めて落下をブロック
  for (let c = 0; c < 10; c++) blocked[19][c] = 'T';
  let cur: GameState = { ...s, board: blocked };
  let moved;
  while ((moved = movePiece(cur, 0, 1, 0))) cur = moved;
  // これ以上は落下できない
  expect(movePiece(cur, 0, 1, 0)).toBeNull();
});

test('ロックで盤面に 4 セルが書き込まれる', () => {
  const locked = lockPiece(createInitialState());
  const filled = locked.board.flat().filter((c) => c !== null).length;
  expect(filled).toBe(4);
});

test('ロック後に次のピースへ移行する', () => {
  const s = createInitialState();
  const prevNext = s.nextPiece;
  const locked = completeLock(s);
  expect(locked.piece).toEqual(prevNext);
});

test('ライン消し: 1 行 = 40 × レベル', () => {
  const board = createEmptyBoard();
  board[19] = Array(10).fill('I');
  const locked = completeLock({ ...createInitialState(), board });
  expect(locked.lines).toBe(1);
  expect(locked.score).toBe(40);
  expect(hasFullRow(locked.board)).toBe(false);
});

test('ライン消し: 4 行 (テトリス) = 1200 × レベル', () => {
  const board = createEmptyBoard();
  board[16] = Array(10).fill('I');
  board[17] = Array(10).fill('O');
  board[18] = Array(10).fill('T');
  board[19] = Array(10).fill('S');
  const locked = completeLock({ ...createInitialState(), board });
  expect(locked.lines).toBe(4);
  expect(locked.score).toBe(1200);
});

test('スコア加算表が spec と一致する', () => {
  expect(scoreForClear(1, 1)).toBe(40);
  expect(scoreForClear(2, 1)).toBe(100);
  expect(scoreForClear(3, 1)).toBe(300);
  expect(scoreForClear(4, 1)).toBe(1200);
  expect(scoreForClear(1, 3)).toBe(120);
});

test('10 行ごとにレベルが上がる', () => {
  const board = createEmptyBoard();
  board[19] = Array(10).fill('I');
  const locked = completeLock({ ...createInitialState(), board, lines: 9 });
  expect(locked.lines).toBe(10);
  expect(locked.level).toBe(2);
});

test('レベルは 15 で上限', () => {
  const board = createEmptyBoard();
  board[19] = Array(10).fill('I');
  const locked = completeLock({ ...createInitialState(), board, lines: 300 });
  expect(locked.level).toBe(15);
});

test('落下間隔はレベルで短縮され 100ms が下限', () => {
  expect(dropIntervalMs(1)).toBe(800);
  expect(dropIntervalMs(2)).toBe(680);
  expect(dropIntervalMs(15)).toBe(100);
  expect(dropIntervalMs(30)).toBe(100);
});

test('空盤面ではゲームオーバーにならない', () => {
  expect(isGameOver(createInitialState())).toBe(false);
});

test('出現位置が埋まっていればゲームオーバー', () => {
  const board = createEmptyBoard();
  for (let r = 0; r < 20; r++) board[r] = Array(10).fill('T');
  expect(isGameOver({ ...createInitialState(), board })).toBe(true);
});
