import { test, expect } from '@playwright/test';
import {
  scoreForClear,
  dropIntervalMs,
  levelForLines,
  isLevelUp,
  completeLock,
  type GameState,
} from '../src/game';
import { createEmptyBoard, type Piece, type TetrominoId } from '../src/tetromino';

// 乱数に依存しないクリーンなテスト用状態
function makeState(
  piece: Piece,
  board: (TetrominoId | null)[][] = createEmptyBoard(),
  lines = 0,
  level = 1
): GameState {
  return {
    board,
    piece,
    nextPiece: { id: 'O', x: 3, y: 0, rotation: 0 },
    isOver: false,
    score: 0,
    lines,
    level,
    clearingRows: [],
  };
}

test.describe('加算表 (spec §2.5: 40/100/300/1200 × レベル)', () => {
  test('レベル 1 の各行数', () => {
    expect(scoreForClear(1, 1)).toBe(40);
    expect(scoreForClear(2, 1)).toBe(100);
    expect(scoreForClear(3, 1)).toBe(300);
    expect(scoreForClear(4, 1)).toBe(1200);
  });

  test('レベル 3 で 3 倍', () => {
    expect(scoreForClear(1, 3)).toBe(120);
    expect(scoreForClear(4, 3)).toBe(3600);
  });

  test('0 行は 0 点（レベル無関係）', () => {
    expect(scoreForClear(0, 1)).toBe(0);
    expect(scoreForClear(0, 15)).toBe(0);
  });
});

test.describe('レベル進行 (10 行ごとに +1, 上限 15)', () => {
  const cases: [number, number][] = [
    [0, 1],
    [9, 1],
    [10, 2],
    [19, 2],
    [20, 3],
    [90, 10],
    [99, 10],
    [100, 11],
    [140, 15],
    [149, 15],
    [150, 15],
    [9999, 15],
  ];
  for (const [lines, expected] of cases) {
    test(`lines=${lines} → level=${expected}`, () => {
      expect(levelForLines(lines)).toBe(expected);
    });
  }
});

test.describe('落下間隔 (max(100, round(800 × 0.85^(level-1))))', () => {
  test('レベル 1 = 800ms', () => {
    expect(dropIntervalMs(1)).toBe(800);
  });

  test('レベルが上がるほど短縮される', () => {
    const l1 = dropIntervalMs(1);
    const l10 = dropIntervalMs(10);
    const l15 = dropIntervalMs(15);
    expect(l1).toBeGreaterThan(l10);
    expect(l10).toBeGreaterThan(l15);
  });

  test('100ms が下限（レベル 15 で到達、それ以上は維持）', () => {
    expect(dropIntervalMs(15)).toBe(100);
    expect(dropIntervalMs(16)).toBe(100);
    expect(dropIntervalMs(99)).toBe(100);
  });
});

test.describe('レベルアップ検出 (isLevelUp)', () => {
  test('レベルが上がっていれば true', () => {
    expect(isLevelUp(1, 2)).toBe(true);
    expect(isLevelUp(14, 15)).toBe(true);
  });

  test('レベルが変わらなければ false', () => {
    expect(isLevelUp(1, 1)).toBe(false);
    expect(isLevelUp(5, 5)).toBe(false);
  });

  test('レベルが下がっていなければ false（安全側）', () => {
    expect(isLevelUp(3, 2)).toBe(false);
  });
});

test.describe('実機: completeLock でのレベル上昇', () => {
  test('9 行目から 1 行消して 10 行 → レベル 2（レベルアップ判定 true）', () => {
    const board = createEmptyBoard();
    board[19] = Array(10).fill('I');
    const s = makeState({ id: 'O', x: 3, y: 0, rotation: 0 }, board, 9, 1);
    const resolved = completeLock(s);
    expect(resolved.lines).toBe(10);
    expect(resolved.level).toBe(2);
    expect(isLevelUp(s.level, resolved.level)).toBe(true);
  });

  test('まだ 10 行に届かずに消してもレベルアップなし', () => {
    const board = createEmptyBoard();
    board[19] = Array(10).fill('I');
    const s = makeState({ id: 'O', x: 3, y: 0, rotation: 0 }, board, 5, 1);
    const resolved = completeLock(s);
    expect(resolved.lines).toBe(6);
    expect(resolved.level).toBe(1);
    expect(isLevelUp(s.level, resolved.level)).toBe(false);
  });

  test('レベル 15 は超えない', () => {
    const board = createEmptyBoard();
    board[19] = Array(10).fill('I');
    const s = makeState({ id: 'O', x: 3, y: 0, rotation: 0 }, board, 300, 15);
    const resolved = completeLock(s);
    expect(resolved.level).toBe(15);
    expect(isLevelUp(s.level, resolved.level)).toBe(false);
  });
});
