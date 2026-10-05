# 進捗のまとめ

| Issue | タイトル | ステータス |
|------|-----------|------------|
| 001 | 盤面とピース定義 | ✅ 完了 |
| 002 | Game Loop | ✅ 完了 |
| 003 | Move & Rotate | ✅ 完了（コア範囲 / 壁打ち→012・smooth→014 は別 Issue） |
| 004 | Soft & Hard Drop | ✅ 完了 |
| 005 | Line Clear | ✅ 完了（2 フェーズ + フラッシュ + アニメ中入力制御） |
| 006 | Score & Level | 🔄 実装中（加算表・レベル・速度済み / 視覚フィードバック残） |
| 007 | Next & Hold | ⬜ 未着手 |
| 008 | Pause & Game Over | ⬜ 未着手 |
| 009 | Highscore | ⬜ 未着手 |
| 010 | UI Accessibility | ⬜ 未着手 |
| 011 | Ghost Piece | ⬜ 未着手 |
| 012 | Wall Kick | ⬜ 未着手 |
| 013 | CCW Keys | ⬜ 未着手 |
| 014 | DAS/ARR | ⬜ 未着手 |
| 015 | Sound | ⬜ 未着手 |
| 016 | Combo Bonus | ⬜ 未着手 |
| 017 | Stats | ⬜ 未着手 |
| 018 | Difficulty Modes | ⬜ 未着手 |
| 019 | Themes | ⬜ 未着手 |
| 020 | i18n | ⬜ 未着手 |
| 021 | Touch Mobile | ⬜ 未着手 |
| 022 | Leaderboard | ⬜ 未着手 |

## 変更点
- 001 のステータスを **✅ 完了** に更新
- 002 は **Game Loop** を実装し **✅ 完了** に更新（`src/tetromino.ts` / `src/game.ts` / `src/App.tsx`）
- 002 の実装で 003〜006 の基本機能が反映されたため、各自 **🔄 実装中** に更新（残タスクは各 Issue 参照）
- 003 は **Move & Rotate** を `move`/`rotate` に抽出し、テスト `e2e/03-move-rotate.test.ts` を追加の上 **✅ 完了** に更新（smooth→014・壁打ち→012 は別 Issue）
- 004 は **Soft & Hard Drop** の得点加算を `softDrop`/`hardDrop` で実装し、テスト `e2e/04-soft-hard-drop.test.ts` を追加の上 **✅ 完了** に更新
- 005 は **ライン消しとアニメーション** を 2 フェーズ化（`lockPiece`/`resolveClear`）し、フラッシュアニメーションとアニメーション中の入力制御を実装、テスト `e2e/05-line-clear.test.ts` を追加の上 **✅ 完了** に更新
- 進捗表を `issues/README.md` に掲載（`issues/progress.md` は不要のため削除済み）

## 今後のタスク
- 006: レベルアップ時の視覚フィードバック
- 007〜: Next & Hold、Pause、Highscore などへ着手

---

**備考**：`issues/progress.md` は不要になったため削除済みです。
