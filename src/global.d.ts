import type { TetrominoId } from "./game/types";

declare global {
  interface Window {
    __spawn?: (id: TetrominoId) => void;
  }
}

export {};
