import { useCallback, useEffect, useState } from "react";
import Board from "./components/Board";
import { createBoard, placeCells } from "./game/board";
import { pieceCells, spawnPiece } from "./game/pieces";
import type { Board as BoardModel, TetrominoId } from "./game/types";

export default function App() {
  const [board, setBoard] = useState<BoardModel>(createBoard);

  const spawn = useCallback((id: TetrominoId) => {
    const piece = spawnPiece(id);
    setBoard((prev) => placeCells(prev, pieceCells(piece), id));
  }, []);

  useEffect(() => {
    window.__spawn = spawn;
    return () => {
      window.__spawn = undefined;
    };
  }, [spawn]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-white py-8 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <h1 className="text-4xl font-bold tracking-tight">Tetris</h1>
      <Board board={board} />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        デバッグ: <code className="font-mono">window.__spawn(&quot;I&quot;)</code>
      </p>
    </main>
  );
}
