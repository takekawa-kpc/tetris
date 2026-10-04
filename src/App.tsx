import React from 'react';
import { useState, useEffect } from 'react';
import {
  createInitialState,
  movePiece,
  lockPiece,
  isGameOver,
  type GameState,
} from './game';

const CELL_SIZE = 20;

const BoardCell: React.FC<{ value: string | null }> = ({ value }) => (
  <div
    className="w-[20px] h-[20px] border border-black"
    style={{ backgroundColor: value ? 'cyan' : 'white' }}
  />
);

const App: React.FC = () => {
  const [state, setState] = useState<GameState>(createInitialState());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const newState = movePiece(state, 0, 1, 0);
      if (!newState) {
        const locked = lockPiece(state);
        setState(locked);
        if (isGameOver(locked)) {
          alert('Game Over');
        }
      } else {
        setState(newState);
      }
      setTick((t) => t + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [state, tick]);

  const displayBoard = state.board.map(row => [...row]);
  if (state.piece && state.piece.y >= 0) {
    const { x, y, id } = state.piece;
    displayBoard[y][x] = id;
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-2xl mb-4">Tetris</h1>
      <div className="grid grid-cols-10 gap-px bg-black">
        {displayBoard.flat().map((cell, idx) => (
          <BoardCell key={idx} value={cell} />
        ))}
      </div>
    </div>
  );
};

export default App;
