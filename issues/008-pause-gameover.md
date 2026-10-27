# 008 ポーズとゲームオーバー

- 区分: v1 / 依存: 007 / 状態: ⬜ 未着手
- 仕様根拠: §3.11

## ゴール

ready / playing / paused / gameover の状態マシンとオーバーレイを完成させる。

## 実装内容

- [ ] `ready` 開始画面(Space で開始)。Space はハードドロップと兼用しない
- [ ] `P` / `Esc` ポーズ ↔ 復帰、`paused` 中は重力・入力停止
- [ ] ブロックアウトで `gameover`(§3.4 判定を 008 で UI 化)。最終スコア表示
- [ ] `R` とオーバーレイボタンでリセット(ハイスコア以外初期化)

## テスト(Playwright)

- [ ] Space 開始 → `P` 停止 → `P` 復帰 → `R` 初期化の一連
- [ ] 積み上げで `gameover` オーバーレイと `restart-button` が出る
- [ ] リセット後 score / level / lines / 盤面が初期値

## 完了条件

全状態遷移 e2e が green。
