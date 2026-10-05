import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialState,
  move,
  rotate,
  softDrop,
  lockPiece,
  resolveClear,
  dropToBottom,
  dropIntervalMs,
  pieceCells,
  isLevelUp,
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

// ライン消しのフラッシュ時間 (spec §2.3: 約 250ms)
const CLEAR_MS = 250;

// レベルアップの視覚フィードバック時間 (spec §2.5: 一瞬の高ライト表示)
const LEVEL_UP_MS = 900;

// フラッシュ中に表示する情報
type Flash = {
  board: (TetrominoId | null)[][]; // ロック済み・満行を含む盤面
  rows: number[]; // フラッシュする行番号
  final: GameState; // 解決後(次のピース・スコア反映済み)
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

function Stat({
  label,
  value,
  className = '',
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className={'tabular-nums text-lg font-semibold ' + className} aria-live="polite">
        {value}
      </span>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [started, setStarted] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);
  // レベルアップ中表示する新レベル（null なら表示なし）
  const [levelUp, setLevelUp] = useState<number | null>(null);

  // キー入力・ゲームループが常に最新の state を参照できるよう ref で保持
  const stateRef = useRef(state);
  stateRef.current = state;

  // フラッシュ中は落下・入力を停止する
  const acting = started && !state.isOver && !flash;

  const reset = useCallback(() => {
    setState(createInitialState());
    setFlash(null);
    setStarted(true);
  }, []);

  // ロック発生 → 満行があればフラッシュ、なければ直結で解決(次ピース出現)
  const performLock = useCallback((s: GameState, dropped: number) => {
    const locked = lockPiece(s);
    const final = resolveClear(locked);
    const scored = dropped > 0 ? { ...final, score: final.score + dropped * 2 } : final;
    // レベルアップなら視覚フィードバック（一瞬の高ライト表示, spec §2.5）
    if (isLevelUp(s.level, scored.level)) {
      setLevelUp(scored.level);
    }
    if (locked.clearingRows.length > 0) {
      setFlash({ board: locked.board, rows: locked.clearingRows, final: scored });
    } else {
      setState(scored);
    }
  }, []);

  // ハードドロップ (Space): 着地 → ロック(満行あればフラッシュ) → 落下セル × 2 点
  const performHardDrop = useCallback(() => {
    const s = stateRef.current;
    if (s.isOver) return;
    const { state: bottom, dropped } = dropToBottom(s);
    performLock(bottom, dropped);
  }, [performLock]);

  // ゲームループ: 落下間隔ごとに 1 セル下方へ。動けなければロック
  useEffect(() => {
    if (!acting) return;
    const id = setInterval(() => {
      const s = stateRef.current;
      if (s.isOver) return;
      const moved = move(s, 0, 1);
      if (moved) {
        setState(moved);
      } else {
        performLock(s, 0);
      }
    }, dropIntervalMs(state.level));
    return () => clearInterval(id);
  }, [acting, state.level, performLock]);

  // フラッシュ完了: 約 250ms 後に解決状態へ反映(次のピース出現・落下再開)
  useEffect(() => {
    if (!flash) return;
    const final = flash.final;
    const id = setTimeout(() => {
      setState(final);
      setFlash(null);
    }, CLEAR_MS);
    return () => clearTimeout(id);
  }, [flash]);

  // レベルアップの視覚フィードバック: 約 900ms 後に解除
  useEffect(() => {
    if (levelUp === null) return;
    const id = setTimeout(() => setLevelUp(null), LEVEL_UP_MS);
    return () => clearTimeout(id);
  }, [levelUp]);

  // キーボード入力
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' && !started) {
        e.preventDefault();
        setStarted(true);
        return;
      }
      if (stateRef.current.isOver) {
        if (e.key === 'r' || e.key === 'R') reset();
        return;
      }
      // フラッシュ中は操作入力を無視
      if (!started || flash) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setState((cur) => move(cur, -1, 0) ?? cur);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setState((cur) => move(cur, 1, 0) ?? cur);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setState((cur) => rotate(cur, 1) ?? cur);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setState((cur) => softDrop(cur));
          break;
        case ' ':
          e.preventDefault();
          performHardDrop();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, flash, reset, performHardDrop]);

  // 表示用盤面: フラッシュ中はロック済み盤面、それ以外は進行中盤面
  const display = flash ? flash.board : buildDisplay(state);
  const flashRows = new Set(flash?.rows ?? []);

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
            {display.flat().map((cell, i) => {
              const row = Math.floor(i / BOARD_W);
              const isFlashing = flashRows.has(row);
              return (
                <div
                  key={i}
                  className={
                    'h-7 w-7 rounded-[3px] bg-white transition-colors duration-150 dark:bg-gray-900 ' +
                    (isFlashing ? 'tetris-clear' : '')
                  }
                  style={{
                    backgroundColor: cell ? COLORS[cell] : undefined,
                  }}
                />
              );
            })}
          </div>

          {/* レベルアップフィードバック: 一瞬の高ライト表示 (spec §2.5) */}
          {levelUp !== null && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div
                key={levelUp}
                className="level-up-banner rounded-lg bg-black/60 px-5 py-2 text-lg font-bold text-amber-300 shadow-lg backdrop-blur-sm dark:bg-white/10"
              >
                レベルアップ！ Lv.{levelUp}
              </div>
            </div>
          )}

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
            <Stat
              label="レベル"
              value={state.level}
              className={levelUp !== null ? 'level-glow' : ''}
            />
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
