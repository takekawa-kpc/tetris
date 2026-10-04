# Tetris

React + Vite + Tailwind CSS で作るブラウザ版テトリス。仕様は [spec.md](./spec.md)、実装タスクは [issues/](./issues/README.md) を参照。

## 開発

```bash
npm install
npm run dev   # http://localhost:5173/game01/
```

## テスト(Playwright)

```bash
npx playwright install chromium   # 初回のみ
npm test
```

## ビルド

```bash
npm run build
```

GitHub Pages 用のため `base: /game01/` としてあります。
