import { test, expect } from '@playwright/test';
import { move, rotate, pieceCells, type GameState } from '../src/game';
import {
  TETROMINO_SHAPES,
  createEmptyBoard,
  BOARD_W,
  type Piece,
  type TetrominoId,
  type Rotation,
} from '../src/tetromino';

const ALL_IDS: TetrominoId[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

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

// 座標集合を順序非依存で比較するための正規化キー
function canon(cells: { col: number; row: number }[]): string {
  return cells
    .map((c) => `${c.col},${c.row}`)
    .sort()
    .join('|');
}

test.describe('移動 (move)', () => {
  test('左へ 1 セル移動する', () => {
    const s = makeState({ id: 'T', x: 5, y: 5, rotation: 0 });
    const next = move(s, -1, 0);
    expect(next).not.toBeNull();
    expect(next!.piece.x).toBe(4);
    expect(next!.piece.y).toBe(5);
  });

  test('右へ 1 セル移動する', () => {
    const s = makeState({ id: 'T', x: 4, y: 5, rotation: 0 });
    const next = move(s, 1, 0);
    expect(next).not.toBeNull();
    expect(next!.piece.x).toBe(5);
  });

  test('下へ 1 セル移動する', () => {
    const s = makeState({ id: 'T', x: 4, y: 5, rotation: 0 });
    const next = move(s, 0, 1);
    expect(next).not.toBeNull();
    expect(next!.piece.y).toBe(6);
  });

  test('移動しても回転状態は変わらない', () => {
    const s = makeState({ id: 'T', x: 4, y: 5, rotation: 2 });
    const next = move(s, 1, 1);
    expect(next!.piece.rotation).toBe(2);
  });

  test('左端を越えて動けない (null を返す)', () => {
    const s = makeState({ id: 'I', x: 0, y: 5, rotation: 0 });
    expect(move(s, -1, 0)).toBeNull();
  });

  test('右端を越えて動けない (null を返す)', () => {
    // I は横幅 4。x = BOARD_W - 4 が右端での最大位置
    const atMax = makeState({ id: 'I', x: BOARD_W - 4, y: 5, rotation: 0 });
    expect(move(atMax, 1, 0)).toBeNull();
    // ひとつ左からは動ける
    const oneLeft = makeState({ id: 'I', x: BOARD_W - 5, y: 5, rotation: 0 });
    expect(move(oneLeft, 1, 0)).not.toBeNull();
  });

  test('左端まで連続移動でき、そこで止まる', () => {
    let s = makeState({ id: 'I', x: BOARD_W - 4, y: 5, rotation: 0 });
    for (let i = 0; i < BOARD_W - 4; i++) {
      const n = move(s, -1, 0);
      expect(n).not.toBeNull();
      s = n!;
    }
    expect(s.piece.x).toBe(0);
    expect(move(s, -1, 0)).toBeNull();
  });

  test('固定セルとぶつかる移動は拒否される', () => {
    const board = createEmptyBoard();
    // I 回転 0 はボックス row 1 を占有 → y=5 で盤面 row 6, col 0-3
    // その真下 row 7, col 2 を埋めると下方移動が衝突する
    board[7][2] = 'T';
    const s = { ...makeState({ id: 'I', x: 0, y: 5, rotation: 0 }), board };
    expect(move(s, 0, 1)).toBeNull();
  });

  test('ゲームオーバー時は移動できない', () => {
    const s = { ...makeState({ id: 'T', x: 4, y: 5, rotation: 0 }), isOver: true };
    expect(move(s, -1, 0)).toBeNull();
  });
});

test.describe('回転 (rotate)', () => {
  test('時計回りに 1 回転する', () => {
    const s = makeState({ id: 'T', x: 3, y: 5, rotation: 0 });
    const next = rotate(s, 1);
    expect(next).not.toBeNull();
    expect(next!.piece.rotation).toBe(1);
  });

  test('反時計回りに 1 回転する (rotation=3)', () => {
    const s = makeState({ id: 'T', x: 3, y: 5, rotation: 0 });
    const next = rotate(s, -1);
    expect(next).not.toBeNull();
    expect(next!.piece.rotation).toBe(3);
  });

  test('4 回転で元の回転状態に戻る', () => {
    let s = makeState({ id: 'T', x: 3, y: 5, rotation: 0 });
    for (let i = 0; i < 4; i++) s = rotate(s, 1)!;
    expect(s.piece.rotation).toBe(0);
  });

  test('回転しても x,y (ボックスの原点) は変わらない', () => {
    const s = makeState({ id: 'T', x: 4, y: 6, rotation: 0 });
    const next = rotate(s, 1);
    expect(next!.piece.x).toBe(4);
    expect(next!.piece.y).toBe(6);
  });

  test('O ピースの回転は形を変えない (identity)', () => {
    const base = makeState({ id: 'O', x: 3, y: 5, rotation: 0 });
    const before = canon(pieceCells(base.piece));
    for (const r of [1, 2, 3] as Rotation[]) {
      const st = makeState({ id: 'O', x: 3, y: 5, rotation: r });
      expect(canon(pieceCells(st.piece))).toBe(before);
    }
  });

  test('I ピースは回転で 横↔縦 が切り替わる', () => {
    const h = TETROMINO_SHAPES['I'][0]; // 回転 0: 横
    const v = TETROMINO_SHAPES['I'][1]; // 回転 1: 縦
    expect(new Set(h.map(([, r]) => r)).size).toBe(1); // 横: 1 行
    expect(new Set(h.map(([c]) => c)).size).toBe(4); // 横: 4 列
    expect(new Set(v.map(([, r]) => r)).size).toBe(4); // 縦: 4 行
    expect(new Set(v.map(([c]) => c)).size).toBe(1); // 縦: 1 列
  });

  test('すべてのピースの各回転状態は 4 セルかつ 4x4 ボックス内', () => {
    ALL_IDS.forEach((id) => {
      TETROMINO_SHAPES[id].forEach((cells) => {
        expect(cells.length).toBe(4);
        cells.forEach(([c, r]) => {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(3);
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThanOrEqual(3);
        });
      });
    });
  });

  test('壁の近くで回転が盤面外に達すると拒否される (Wall Kick なし)', () => {
    // T 回転 0 (col 0-2) を x=7 で → 回転 1 は col 3 に達し col 10 (盤面外)
    const s = makeState({ id: 'T', x: 7, y: 5, rotation: 0 });
    const before = canon(pieceCells(s.piece));
    expect(rotate(s, 1)).toBeNull();
    // ピースは元の位置のまま (state が変更されない)
    expect(canon(pieceCells(s.piece))).toBe(before);
  });

  test('固定セルとぶつかる回転は拒否される', () => {
    // T (x=3, 回転 0) の回転 1 で col 5, row 5 にセルが来る
    const board = createEmptyBoard();
    board[5][5] = 'Z';
    const s = { ...makeState({ id: 'T', x: 3, y: 5, rotation: 0 }), board };
    expect(rotate(s, 1)).toBeNull();
  });

  test('ゲームオーバー時は回転できない', () => {
    const s = { ...makeState({ id: 'T', x: 3, y: 5, rotation: 0 }), isOver: true };
    expect(rotate(s, 1)).toBeNull();
  });
});
