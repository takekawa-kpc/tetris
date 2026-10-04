import { test, expect } from '@playwright/test';
import { createInitialState, movePiece, lockPiece, isGameOver, type GameState } from '../src/game';

// 1. 初期状態
test('initial state', () => {
  const state = createInitialState();
  expect(state.board.length).toBe(20);
  expect(state.board[0].length).toBe(10);
  expect(state.piece).not.toBeNull();
  expect(state.isOver).toBe(false);
});

// 2. ピースを 1 セル下へ移動できる
test('move piece down', () => {
  const state = createInitialState();
  const newState = movePiece(state, 0, 1, 0);
  expect(newState).not.toBeNull();
  expect(newState!.piece!.y).toBe(state.piece!.y + 1);
});

// 3. 盤面下端でロックされる
test('lock at bottom', () => {
  const state = createInitialState();
  let curr: GameState = state;
  for (let i = 0; i < 20; i++) {
    const moved = movePiece(curr, 0, 1, 0);
    if (!moved) break;
    curr = moved;
  }
  const cannotMove = movePiece(curr, 0, 1, 0);
  expect(cannotMove).toBeNull();
  const locked = lockPiece(curr);
  // ピースが盤面に固定されているか確認
  expect(locked.board[locked.piece!.y][locked.piece!.x]).toBe(locked.piece!.id);
});

// 4. 上部に到達したときゲームオーバー
test('game over when piece reaches top', () => {
  const state = createInitialState();
  let curr: GameState = state;
  for (let i = 0; i < 5; i++) {
    const moved = movePiece(curr, 0, -1, 0);
    if (!moved) break;
    curr = moved;
  }
  expect(isGameOver(curr)).toBe(true);
});
