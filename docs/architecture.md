# アーキテクチャ

## 概要

このリポジトリには、外部ライブラリを使わずに HTML・CSS・JavaScript のみで動作する水槽観賞アプリを配置しています。

## ディレクトリ構成

```text
.
├── README.md
├── aquarium-viewer/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── assets/
│   │   └── fish/
│   └── README.md
└── docs/
    ├── architecture.md
    ├── codex_report.md
    └── next_tasks.md
```

## 設計メモ

- `aquarium-viewer/index.html` は操作パネルと Canvas を定義します。
- `aquarium-viewer/style.css` は全画面水槽レイアウト、操作パネル、レスポンシブ表示を担当します。
- `aquarium-viewer/script.js` は `Fish`、`Bubble`、`Food` クラスと描画・更新ループを持ちます。魚の移動・餌追跡ロジックは `Fish` クラスに残し、描画はローカルSVGスプライトを事前読み込みしてCanvasへ合成します。
- 描画は `requestAnimationFrame` で継続実行し、Canvas 上に水面、水、砂地、装飾、魚、泡、餌を描画します。魚スプライトのロード前やロード失敗時は、従来のCanvas図形魚へフォールバックします。
- 設定値は `localStorage` に保存され、再読み込み後も維持されます。
