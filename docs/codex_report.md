## 今回やったこと
- 既存の `aquarium-viewer` アプリを対象に、魚の描画をCanvas図形中心から透明背景SVGスプライト中心へ切り替えました。
- 5魚種（金魚型、エンゼルフィッシュ型、小魚型、フグ型、ナマズ型）それぞれにオリジナルSVGアセットを追加しました。
- ごんべ、ゾロカンス、ミレスの専用魚種設定を維持し、既存の移動、餌追跡、端での反転、巡航速度復帰ロジックは残しました。
- 画像ロード前・ロード失敗時は従来のCanvas図形魚へフォールバックするようにしました。

## 変更ファイル
- `aquarium-viewer/script.js`
- `aquarium-viewer/README.md`
- `aquarium-viewer/assets/fish/README.md`
- `aquarium-viewer/assets/fish/goldfish.svg`
- `aquarium-viewer/assets/fish/angelfish.svg`
- `aquarium-viewer/assets/fish/minnow.svg`
- `aquarium-viewer/assets/fish/puffer.svg`
- `aquarium-viewer/assets/fish/catfish.svg`

## テスト結果
- `git status --short --branch` と対象3ファイルの存在確認を実施しました。
- `node --check aquarium-viewer/script.js` は成功しました。
- `/tmp/validate_aquarium_sprites.js` で、5魚種のスプライト定義、ローカルアセット参照、名前付き魚設定、巡航速度・方向・端反転・餌消失後復帰ロジック、デバッグ用グローバル未追加を確認しました。

## 注意点
- 実ブラウザでの目視確認とスクリーンショット取得は、この作業環境では未実施です。
- スプライトは簡易イラストとして自作したSVGで、外部画像やCDNは使用していません。

## 次にやるべきこと
- ブラウザで `aquarium-viewer/index.html` を開き、魚種の見分けや名前表示、餌追跡、昼夜切替を目視確認してください。
- 必要に応じて、魚ごとのスプライトをさらに高精細化してください。

## チャッピーに相談すべき点
- 現在の簡易リアル寄りSVGで十分か、より写実寄りのアートスタイルへ寄せるべきか。
- ゾロカンス専用スプライトを追加して、通常小魚型との差をさらに強めるべきか。
