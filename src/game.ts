// テストで使う簡易ゲームロジック（実装は最小限）
export interface GameState {
  board: (string | null)[][];
  piece: {
    id: string;
    x: number;
    y: number;
    rotation: 0 | 1 | 2 | 3;
  } | null;
  nextPiece: {
    id: string;
    x: number;
    y: number;
    rotation: 0 | 1 | 2 | 3;
  };
  isOver: boolean;
}

export function createInitialState(): GameState {
  const board: (string | null)[][] = Array.from({ length: 20 }, () => Array.from({ length: 10 }, () => null));
  const generator = new PieceGenerator();
  const first = generator.next();
  const next = generator.next();
  const piece = {
    id: first,
    x: Math.floor((10 - 4) / 2),
    y: -1,
    rotation: 0,
  };
  return {
    board,
    piece,
    nextPiece: {
      id: next,
      x: Math.floor((10 - 4) / 2),
      y: -1,
      rotation: 0,
    },
    isOver: false,
  };
}

export function movePiece(state: GameState, dx: number, dy: number, rotation: number) {
  const { piece } = state;
  if (!piece) return null;
  const newX = piece.x + dx;
  const newY = piece.y + dy;
  if (newX < 0 || newX >= 10) return null;
  if (newY >= 20) return null;
  const newPiece = { ...piece, x: newX, y: newY, rotation };
  return { ...state, piece: newPiece };
}

export function lockPiece(state: GameState): GameState {
  const { piece, board, nextPiece } = state;
  if (!piece) return state;
  const newBoard = board.map(row => [...row]);
  newBoard[piece.y][piece.x] = piece.id;
  return {
    ...state,
    board: newBoard,
  };
}

export function isGameOver(state: GameState) {
  const { piece } = state;
  if (!piece) return false;
  return piece.y <= 0;
}

class PieceGenerator {
  private bag: string[] = [];
  next() {
    if (this.bag.length === 0) {
      this.bag = shuffle([...['I', 'O', 'T', 'S', 'Z', 'J', 'L']]);
    }
    return this.bag.pop()!;
  }
}

function shuffle<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
