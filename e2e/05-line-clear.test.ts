import { test, expect } from '@playwright/test';
import {
  lockPiece,
  resolveClear,
  completeLock,
  hardDrop,
  dropToBottom,
  type GameState,
} from '../src/game';
import { createEmptyBoard, type Piece, type TetrominoId } from '../src/tetromino';

// 乱数に依存しないクリーンなテスト用状態を作る
function makeState(
  piece: Piece,
  board: (TetrominoId | null)[][] = createEmptyBoard()
): GameState {
  return {
    board,
    piece,
    nextPiece: { id: 'O', x: 3, y: 0, rotation: 0 },
    isOver: false,
    score: 0,
    lines: 0,
    level: 1,
    clearingRows: [],
  };
}

const filled = (board: (TetrominoId | null)[][]) =>
  board.flat().filter((c) => c !== null).length;

test.describe('満行検出 (lockPiece / ロックフェーズ)', () => {
  test('満行がなければ clearingRows は空で、4 セルが固定される', () => {
    const locked = lockPiece(makeState({ id: 'T', x: 3, y: 5, rotation: 0 }));
    expect(locked.clearingRows).toEqual([]);
    expect(filled(locked.board)).toBe(4);
  });

  test('1 行の満行を検出する（消去は保留）', () => {
    const board = createEmptyBoard();
    for (let c = 0; c < 9; c++) board[19][c] = 'J'; // col 9 だけ空け
    // 縦 I (col 9) を着地位置に置き、col 9 を足して満行
    const s = makeState({ id: 'I', x: 7, y: 16, rotation: 1 }, board);
    const locked = lockPiece(s);
    expect(locked.clearingRows).toEqual([19]);
    // 満行はまだ消去されていない(フラッシュ中)
    expect(locked.board[19].every((c) => c !== null)).toBe(true);
    // スコア・ラインはロックフェーズでは加算されない
    expect(locked.score).toBe(0);
    expect(locked.lines).toBe(0);
  });

  test('2 行の満行を検出する', () => {
    const board = createEmptyBoard();
    board[18] = Array(10).fill('J');
    board[19] = Array(10).fill('L');
    const locked = lockPiece(makeState({ id: 'O', x: 3, y: 0, rotation: 0 }, board));
    expect(locked.clearingRows).toEqual([18, 19]);
  });

  test('フラッシュ中は次のピースに出現しない (piece は固定済みのまま)', () => {
    const locked = lockPiece(makeState({ id: 'T', x: 3, y: 5, rotation: 0 }));
    expect(locked.piece.id).toBe('T');
    expect(locked.nextPiece.id).toBe('O');
  });
});

test.describe('満行解決 (resolveClear)', () => {
  test('1 行消去: 上段がシフトされ、空行が上端に追加される', () => {
    const board = createEmptyBoard();
    board[19] = Array(10).fill('I'); // 最下行が満行
    board[18][0] = 'L'; // その 1 行上にセル
    const s = makeState({ id: 'O', x: 3, y: 0, rotation: 0 }, board);
    const resolved = resolveClear(lockPiece(s));
    // 満行が消え、上のセルが最下行へシフト
    expect(resolved.board[19][0]).toBe('L');
    expect(resolved.board[18][0]).toBe(null);
    // O の 4 セル + L の 1 セル
    expect(filled(resolved.board)).toBe(5);
    expect(resolved.clearingRows).toEqual([]);
    expect(resolved.lines).toBe(1);
  });

  test('1 行消去: 40 × レベル が加算される', () => {
    const board = createEmptyBoard();
    board[19] = Array(10).fill('I');
    const s = makeState({ id: 'O', x: 3, y: 0, rotation: 0 }, board);
    const resolved = resolveClear(lockPiece(s));
    expect(resolved.score).toBe(40);
  });

  test('2 行消去: 100 × レベル', () => {
    const board = createEmptyBoard();
    board[18] = Array(10).fill('I');
    board[19] = Array(10).fill('O');
    const s = makeState({ id: 'T', x: 3, y: 0, rotation: 0 }, board);
    const resolved = resolveClear(lockPiece(s));
    expect(resolved.lines).toBe(2);
    expect(resolved.score).toBe(100);
  });

  test('3 行消去: 300 × レベル', () => {
    const board = createEmptyBoard();
    board[17] = Array(10).fill('I');
    board[18] = Array(10).fill('O');
    board[19] = Array(10).fill('T');
    const s = makeState({ id: 'S', x: 3, y: 0, rotation: 0 }, board);
    const resolved = resolveClear(lockPiece(s));
    expect(resolved.lines).toBe(3);
    expect(resolved.score).toBe(300);
  });

  test('4 行消去 (テトリス): 1200 × レベル', () => {
    const board = createEmptyBoard();
    board[16] = Array(10).fill('I');
    board[17] = Array(10).fill('O');
    board[18] = Array(10).fill('T');
    board[19] = Array(10).fill('S');
    const s = makeState({ id: 'Z', x: 3, y: 0, rotation: 0 }, board);
    const resolved = resolveClear(lockPiece(s));
    expect(resolved.lines).toBe(4);
    expect(resolved.score).toBe(1200);
  });

  test('満行が 2 レベル分積もれば 40 × 2 レベル', () => {
    const board = createEmptyBoard();
    board[19] = Array(10).fill('I');
    const s = { ...makeState({ id: 'O', x: 3, y: 0, rotation: 0 }, board), level: 2 };
    const resolved = resolveClear(lockPiece(s));
    expect(resolved.score).toBe(80);
  });

  test('解決後に次のピースへ移行する', () => {
    const s = makeState({ id: 'T', x: 3, y: 5, rotation: 0 });
    const resolved = resolveClear(lockPiece(s));
    expect(resolved.piece).toEqual({ id: 'O', x: 3, y: 0, rotation: 0 });
  });

  test('消去行のない resolveClear は次ピースへのみ移行（スコアなし）', () => {
    const s = makeState({ id: 'T', x: 3, y: 5, rotation: 0 });
    const resolved = resolveClear(lockPiece(s));
    expect(resolved.score).toBe(0);
    expect(resolved.lines).toBe(0);
    expect(resolved.piece.id).toBe('O');
  });
});

test.describe('2 フェーズ: completeLock は従来(直結)と等価', () => {
  test('completeLock = resolveClear ∘ lockPiece（次ピースの乱数を除く）', () => {
    const board = createEmptyBoard();
    board[19] = Array(10).fill('I');
    const s = makeState({ id: 'O', x: 3, y: 0, rotation: 0 }, board);
    const a = completeLock(s);
    const b = resolveClear(lockPiece(s));
    // 次ピースは乱数で独立に生成されるため、決定論的な部分のみ比較
    const strip = ({ nextPiece, ...rest }: GameState) => rest;
    expect(strip(a)).toEqual(strip(b));
  });
});

test.describe('ハードドロップ + ライン消し (2 フェーズ経由)', () => {
  test('着地ロックで満行 → 消去・スコア・落下得点', () => {
    const board = createEmptyBoard();
    for (let c = 0; c < 9; c++) board[19][c] = 'J'; // col 9 だけ空け
    // 縦 I (col 9) を y=10 から落下 → 6 セル
    const s = makeState({ id: 'I', x: 7, y: 10, rotation: 1 }, board);
    const { state: bottom, dropped } = dropToBottom(s);
    expect(dropped).toBe(6);
    const locked = lockPiece(bottom);
    expect(locked.clearingRows).toEqual([19]);
    const resolved = resolveClear(locked);
    expect(resolved.lines).toBe(1);
    // 落下 6 × 2 = 12 + ライン 40 = 52
    expect(resolved.score + dropped * 2).toBe(52);
  });

  test('hardDrop (直結版) も同じ結果になる', () => {
    const board = createEmptyBoard();
    for (let c = 0; c < 9; c++) board[19][c] = 'J';
    const s = makeState({ id: 'I', x: 7, y: 10, rotation: 1 }, board);
    const result = hardDrop(s);
    expect(result.lines).toBe(1);
    expect(result.score).toBe(52);
    expect(result.clearingRows).toEqual([]);
  });
});
