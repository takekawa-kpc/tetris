import { useCallback, useEffect, useState } from 'react';
import {
  createInitialState,
  move,
  rotate,
  softDrop,
  hardDrop,
  lockPiece,
  dropIntervalMs,
  pieceCells,
  type GameState,
} from './game';
import { BOARD_H, BOARD_W, TETROMINO_SHAPES, type TetrominoId } from './tetromino';

const COLORS: Record<TetrominoId, string> = {
  I: '#22d3ee', // シアン
  O: '#facc15', // 黄
  T: '#a78bfa', // 紫
  S: '#4ade80', // 緑
  Z: '#f87171', // 赤
  J: '#60a5fa', // 青
  L: '#fb923c', // 橙
};

function MiniPiece({ id }: { id: TetrominoId }) {
  const on: boolean[][] = Array.from({ length: 4 }, () => Array(4).fill(false));
  TETROMINO_SHAPES[id][0].forEach(([c, r]) => {
    on[r][c] = true;
  });
  return (
    <div className="grid grid-cols-4" aria-hidden="true">
      {on
        .flat()
        .map((filled, i) => (
          <div
            key={i}
            className="h-4 w-4 rounded-[3px]"
            style={{ backgroundColor: filled ? COLORS[id] : 'transparent' }}
          />
        ))}
    </div>
  );
}

function buildDisplay(state: GameState): (TetrominoId | null)[][] {
  const grid = state.board.map((row) => row.slice());
  for (const { col, row } of pieceCells(state.piece)) {
    if (row >= 0 && row < BOARD_H && col >= 0 && col < BOARD_W) {
      grid[row][col] = state.piece.id;
    }
  }
  return grid;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="tabular-nums text-lg font-semibold" aria-live="polite">
        {value}
      </span>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [started, setStarted] = useState(false);

  const reset = useCallback(() => {
    setState(createInitialState());
    setStarted(true);
  }, []);

  const acting = started && !state.isOver;

  // ゲームループ: 落下間隔ごとに 1 セル下方へ。できなければロック
  useEffect(() => {
    if (!acting) return;
    const id = setInterval(() => {
      setState((s) => {
        if (s.isOver) return s;
        return move(s, 0, 1) ?? lockPiece(s);
      });
    }, dropIntervalMs(state.level));
    return () => clearInterval(id);
  }, [acting, state.level]);

  // キーボード入力
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' && !started) {
        e.preventDefault();
        setStarted(true);
        return;
      }
      if (state.isOver) {
        if (e.key === 'r' || e.key === 'R') reset();
        return;
      }
      if (!started) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setState((s) => move(s, -1, 0) ?? s);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setState((s) => move(s, 1, 0) ?? s);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setState((s) => rotate(s, 1) ?? s);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setState((s) => softDrop(s));
          break;
        case ' ':
          e.preventDefault();
          setState((s) => hardDrop(s));
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, state.isOver, reset]);

  const display = buildDisplay(state);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-100 p-6 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <h1 className="text-3xl font-bold tracking-tight">Tetris</h1>
      <div className="flex items-start gap-6">
        {/* 盤面 */}
        <div className="relative">
          <div
            className="grid gap-px rounded-lg bg-gray-300 p-px dark:bg-gray-700"
            style={{ gridTemplateColumns: `repeat(${BOARD_W}, 1fr)` }}
            aria-hidden="true"
          >
            {display.flat().map((cell, i) => (
              <div
                key={i}
                className="h-7 w-7 rounded-[3px] bg-white transition-colors duration-150 dark:bg-gray-900"
                style={{
                  backgroundColor: cell ? COLORS[cell] : undefined,
                }}
              />
            ))}
          </div>

          {/* Ready / Game Over オーバーレイ */}
          {(!started || state.isOver) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-white/70 backdrop-blur-sm dark:bg-gray-950/70">
              <p className="text-xl font-semibold">
                {state.isOver ? 'ゲームオーバー' : 'スペースでスタート'}
              </p>
              {state.isOver && (
                <p className="text-gray-500 dark:text-gray-400">
                  スコア {state.score}
                </p>
              )}
              <button
                type="button"
                onClick={reset}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 dark:bg-gray-100 dark:text-gray-900"
              >
                {state.isOver ? 'もう一度プレイ' : 'スタート'}
              </button>
            </div>
          )}
        </div>

        {/* 右パネル */}
        <div className="flex w-44 flex-col gap-4">
          <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
            <p className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              NEXT
            </p>
            <MiniPiece id={state.nextPiece.id} />
          </div>

          <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
            <Stat label="スコア" value={state.score} />
            <Stat label="レベル" value={state.level} />
            <Stat label="ライン" value={state.lines} />
          </div>

          <div className="rounded-lg bg-white p-4 text-sm leading-6 text-gray-500 shadow-sm dark:bg-gray-900 dark:text-gray-400">
            <p>← → 移動</p>
            <p>↑ 回転 / ↓ 落下</p>
            <p>Space ハードドロップ</p>
            {state.isOver && <p>R リスタート</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
