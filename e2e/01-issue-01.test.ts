import { test, expect } from '@playwright/test';
import { TETROMINO_SHAPES, PieceGenerator, createEmptyBoard } from '../src/tetromino';
import type { TetrominoId } from '../src/tetromino';

test('createEmptyBoard returns 20x10 board filled with null', () => {
  const board = createEmptyBoard();
  expect(board.length).toBe(20);
  board.forEach(row => {
    expect(row.length).toBe(10);
    row.forEach(cell => {
      expect(cell).toBeNull();
    });
  });
});

test('TETROMINO_SHAPES contains 7 pieces with 4 rotations each and 4 cells per rotation', () => {
  const expectedIds: TetrominoId[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  expectedIds.forEach(id => {
    const shape = TETROMINO_SHAPES[id];
    expect(shape).toBeDefined();
    expect(shape.length).toBe(4);
    shape.forEach(rotation => {
      expect(rotation.length).toBe(4);
      rotation.forEach(cell => {
        expect(cell.length).toBe(2);
        expect(cell[0]).toBeGreaterThanOrEqual(0);
        expect(cell[0]).toBeLessThanOrEqual(3);
        expect(cell[1]).toBeGreaterThanOrEqual(0);
        expect(cell[1]).toBeLessThanOrEqual(3);
      });
    });
  });
});

test('PieceGenerator produces 7 unique pieces before repeating', () => {
  const generator = new PieceGenerator();
  const firstSeven: TetrominoId[] = [];
  for (let i = 0; i < 7; i++) {
    firstSeven.push(generator.next());
  }
  expect(new Set(firstSeven).size).toBe(7);
});
