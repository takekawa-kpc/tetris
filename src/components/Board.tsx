import { COLS, ROWS } from "../game/board";
import { COLORS } from "../game/pieces";
import type { Board as BoardModel } from "../game/types";

export default function Board({ board }: { board: BoardModel }) {
  return (
    <div
      data-testid="board"
      aria-hidden="true"
      className="grid gap-[3px] rounded-xl border border-neutral-300 bg-neutral-300/70 p-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/70"
      style={{
        gridTemplateColumns: `repeat(${COLS}, 28px)`,
        gridTemplateRows: `repeat(${ROWS}, 28px)`,
      }}
    >
      {board.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            data-testid={`cell-${y}-${x}`}
            data-piece={cell ?? ""}
            className={cell ? "rounded-[4px]" : "rounded-[4px] bg-neutral-200 dark:bg-neutral-800/70"}
            style={cell ? { backgroundColor: COLORS[cell] } : undefined}
          />
        )),
      )}
    </div>
  );
}
