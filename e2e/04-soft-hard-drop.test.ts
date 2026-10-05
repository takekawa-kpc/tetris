import { test, expect } from '@playwright/test';
import { softDrop, hardDrop, type GameState } from '../src/game';
import { createEmptyBoard, type Piece } from '../src/tetromino';

// 乱数に依存しないクリーンなテスト用状態を作る
function makeState(piece: Piece): GameState {
  return {
    board: createEmptyBoard(),
    piece,
    nextPiece: { id: 'O', x: 3, y: 0, rotation: 0 },
    isOver: false,
    score: 0,
    lines: 0,
    level: 1,
  };
}

test.describe('ソフトドロップ (softDrop)', () => {
  test('1 セル下へ移動し 1 点加算される', () => {
    const s = makeState({ id: 'T', x: 3, y: 5, rotation: 0 });
    const result = softDrop(s);
    expect(result.piece.y).toBe(6);
    expect(result.score).toBe(1);
  });

  test('ソフトドロップではロックされない（ピースはそのまま）', () => {
    const s = makeState({ id: 'T', x: 3, y: 5, rotation: 0 });
    const result = softDrop(s);
    expect(result.piece.id).toBe('T'); // ロックされず T のまま
    expect(result.board.flat().filter(Boolean).length).toBe(0); // 盤面は空
  });

  test('連続ソフトドロップで 1 セルずつ加算される', () => {
    let s = makeState({ id: 'T', x: 3, y: 5, rotation: 0 });
    for (let i = 0; i < 3; i++) s = softDrop(s);
    expect(s.piece.y).toBe(8);
    expect(s.score).toBe(3);
  });

  test('最下部で動けない場合は無変更（得点なし）', () => {
    // T は box row 0-1 を占有 → y=18 が最下。そこから下方は不可
    const s = makeState({ id: 'T', x: 3, y: 18, rotation: 0 });
    const result = softDrop(s);
    expect(result.piece.y).toBe(18);
    expect(result.score).toBe(0);
  });

  test('固定セルでブロックされた場合は無変更（得点なし）', () => {
    const board = createEmptyBoard();
    // T (x=3,y=5,回転0) が y=6 に動いた先の (col 4, row 7) を固定セルで塞ぐ
    board[7][4] = 'Z';
    const s = { ...makeState({ id: 'T', x: 3, y: 5, rotation: 0 }), board };
    const result = softDrop(s);
    expect(result.piece.y).toBe(5);
    expect(result.score).toBe(0);
  });

  test('ゲームオーバー時は無変更', () => {
    const s = { ...makeState({ id: 'T', x: 3, y: 5, rotation: 0 }), isOver: true };
    const result = softDrop(s);
    expect(result.piece.y).toBe(5);
    expect(result.score).toBe(0);
  });
});

test.describe('ハードドロップ (hardDrop)', () => {
  test('着地してロックされ、落下 1 セル × 2 = 2 点', () => {
    const s = makeState({ id: 'T', x: 3, y: 17, rotation: 0 });
    const result = hardDrop(s);
    expect(result.score).toBe(2);
    expect(result.piece.id).toBe('O'); // ロックされ、次の O が出現
    expect(result.board[19][4]).toBe('T'); // 盤面に T が書込まれる
  });

  test('落下距離に応じて 2 点/セル が加算される (O, 17 セル = 34)', () => {
    // O は box row 1-2 を占有 → y=0 から最下 y=17 まで 17 セル落下
    const s = makeState({ id: 'O', x: 3, y: 0, rotation: 0 });
    const result = hardDrop(s);
    expect(result.score).toBe(17 * 2);
    // ロックされ盤面に O が書込まれる
    expect(result.board[19][4]).toBe('O');
  });

  test('落下得点とライン消し得点が両方加算される', () => {
    const board = createEmptyBoard();
    // 最下行 (row 19) を col 0-8 まで埋め、col 9 のみ空ける
    for (let c = 0; c < 9; c++) board[19][c] = 'J';
    // 縦 I (rotation 1, box col 2) を x=7 で col 9 に配置。y=10 から落下
    const s = { ...makeState({ id: 'I', x: 7, y: 10, rotation: 1 }), board };
    const result = hardDrop(s);
    // 落下 6 セル × 2 = 12 + ライン消し 40 × レベル 1 = 40 → 合計 52
    expect(result.score).toBe(52);
    expect(result.lines).toBe(1);
  });

  test('ロックされたピースもライン消し判定に入る', () => {
    const board = createEmptyBoard();
    for (let c = 0; c < 9; c++) board[19][c] = 'L';
    const s = { ...makeState({ id: 'I', x: 7, y: 10, rotation: 1 }), board };
    const result = hardDrop(s);
    // ライン消し後、最下行は消去され新規の空行が追加される
    expect(result.lines).toBe(1);
    // I の col 9 セルは行が 1 行分ずれて board[19][9] に来る
    expect(result.board[19][9]).toBe('I');
  });

  test('ゲームオーバー時は無変更（ロックもされない）', () => {
    const s = { ...makeState({ id: 'T', x: 3, y: 5, rotation: 0 }), isOver: true };
    const result = hardDrop(s);
    expect(result.score).toBe(0);
    expect(result.piece.id).toBe('T'); // ロックされず T のまま
  });
});
