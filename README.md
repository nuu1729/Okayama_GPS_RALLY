# 🏯 岡山GPS探索スタンプラリー / Okayama GPS Stamp Rally

[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://nuu1729.github.io/Okayama_GPS_RALLY/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

岡山県の観光地を巡るGPS位置情報を活用したスタンプラリーアプリケーションです。実際に指定された場所に足を運んでスタンプを集める、リアル連動型の観光促進アプリです。

<!-- 📸 TODO: メイン画面のスクリーンショットをここに追加 -->
<!-- ![アプリメイン画面](screenshots/main-screen.png) -->

## ✨ 特徴・機能

### 🎯 コア機能
- **GPS連動スタンプ収集**：実際の観光地に近づくとスタンプを獲得
- **4つの観光スポット**：岡山城、後楽園、西古松南部公園、大元東公園
- **リアルタイム距離表示**：現在地からの距離を常時表示
- **インタラクティブ地図**：Leaflet.jsによる詳細な地図表示

<!-- 📸 TODO: スタンプ獲得時のアニメーションGIFをここに追加 -->
<!-- ![スタンプ獲得アニメーション](screenshots/stamp-collection.gif) -->

### 🌍 多言語対応
- 日本語 🇯🇵
- English 🇺🇸  
- 한국어 🇰🇷
- 中文 🇨🇳

<!-- 📸 TODO: 言語切り替えのスクリーンショットをここに追加 -->
<!-- ![多言語対応](screenshots/multilingual.png) -->

### 📱 モダンなUI/UX
- **PWA対応**：オフラインでも動作、スマホにインストール可能
- **ダークモード**：昼夜問わず快適に利用
- **レスポンシブデザイン**：スマホ・タブレット・PCに対応
- **コレクション機能**：獲得したスタンプを図鑑風に表示

<!-- 📸 TODO: ダークモード比較のスクリーンショットをここに追加 -->
<!-- ![ライト/ダークモード](screenshots/theme-comparison.png) -->

### 🎵 エンターテイメント
- **BGM機能**：雰囲気を盛り上げるバックグラウンドミュージック
- **効果音**：スタンプ獲得時のサウンドエフェクト
- **アニメーション**：全スタンプ制覇時の花火演出

## 🚀 クイックスタート

### 前提条件
- Node.js (v16以上)
- npm または yarn
- モダンなWebブラウザ（Chrome、Firefox、Safari、Edge）

### インストール・セットアップ

1. **リポジトリのクローン**
```bash
git clone https://github.com/nuu1729/Okayama_GPS_RALLY.git
cd Okayama_GPS_RALLY
```

2. **バックエンドのセットアップ**
```bash
cd backend
npm install
npm run dev
```
バックエンドが `http://localhost:3000` で起動します。また、TypeScript の典型的なエラーで、`cors`モジュールの型定義ファイルが見つからない場合，以下のようなエラーを示します．
```bash
error TS7016: Could not find a declaration file for module 'cors'.
```
このときは以下の対処を行ってください．

- 型定義をインストールする：`cors`は JavaScript のライブラリなので、TypeScript で使うには型定義を追加する必要があります。
```bash
npm install --save-dev @types/cors
```

3. **フロントエンドの起動**
```bash
# 新しいターミナルで
cd docs
# 簡単なHTTPサーバーを起動（Python使用例）
python -m http.server 8080
# または Node.js の場合
npx http-server . -p 8080
```

4. **ブラウザでアクセス**
`http://localhost:8080` にアクセスしてアプリケーションを開始

<!-- 📸 TODO: セットアップ完了後の初回起動画面をここに追加 -->
<!-- ![初回起動画面](screenshots/first-launch.png) -->

### 📂 プロジェクト構成

```
Okayama_GPS_RALLY/
├── 📁 backend/                 # Express.js API サーバー
│   ├── 📁 src/
│   │   └── server.ts           # メインサーバーファイル
│   ├── package.json            # バックエンド依存関係
│   └── tsconfig.json           # TypeScript設定
├── 📁 docs/                    # フロントエンドファイル（GitHub Pages用）
│   ├── index.html              # メインHTMLファイル
│   ├── script.js               # メインJavaScript
│   ├── style.css               # スタイルシート
│   ├── sw.js                   # Service Worker
│   ├── manifest.json           # PWAマニフェスト
│   ├── 📁 images/              # 画像リソース
│   ├── 📁 icons/               # PWAアイコン
│   └── 📁 Sounds/              # オーディオファイル
└── package.json                # プロジェクト設定
```

## 🎮 使い方

### 基本的な流れ

1. **位置情報の許可**: ブラウザで位置情報アクセスを許可
2. **目的地の選択**: 4つの観光地から行きたい場所を選択
3. **現地へ移動**: アプリの地図を見ながら実際に現地へ
4. **スタンプ獲得**: 指定範囲内に入ると「スタンプを獲得する」ボタンが有効化
5. **コレクション確認**: 獲得したスタンプをコレクション画面で確認

<!-- 📸 TODO: 実際の使用フローを示すGIFアニメーションをここに追加 -->
<!-- ![使用方法フロー](screenshots/usage-flow.gif) -->

### 📱 地図機能

- **現在地表示**: 赤いマーカーで現在位置を表示
- **スポットマーカー**: 各観光地にピンを配置
- **ズーム・パン**: 拡大縮小・移動が可能

<!-- 📸 TODO: 地図画面のスクリーンショットをここに追加 -->
<!-- ![地図機能](screenshots/map-feature.png) -->

### 🏆 コレクション機能

- **図鑑風表示**: 獲得したスタンプを美しく表示
- **未獲得表示**: まだ獲得していないスタンプは「？？？」で表示
- **詳細情報**: 各スポットの写真と詳細情報を表示

<!-- 📸 TODO: コレクション画面（獲得前後）のスクリーンショットをここに追加 -->
<!-- ![コレクション画面](screenshots/collection-screen.png) -->

## 🛠️ 技術仕様

### フロントエンド
- **HTML5**: セマンティックマークアップ
- **CSS3**: グリッドレイアウト、アニメーション、レスポンシブデザイン
- **Vanilla JavaScript**: ES6+、Geolocation API、Web Audio API
- **Leaflet.js**: インタラクティブ地図表示
- **PWA**: Service Worker、Web App Manifest

### バックエンド
- **Node.js**: ランタイム環境
- **Express.js**: Webアプリケーションフレームワーク
- **TypeScript**: 型安全性の確保
- **CORS**: クロスオリジン対応

### 対応ブラウザ
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 🔧 開発者向け情報

### デバッグ機能

本アプリにはデバッグモードが搭載されています：

<!-- 📸 TODO: デバッグモードのスクリーンショットをここに追加 -->
<!-- ![デバッグ機能](screenshots/debug-mode.png) -->

- **🐞 デバッグモード切替**: 開発者向け機能の表示
- **📍 現在地表示**: GPS座標の確認
- **✅ 全て獲得**: テスト用に全スタンプ獲得
- **🗑️ 全てクリア**: データリセット

### API エンドポイント

```typescript
GET /api/stamps
```

スタンプ情報を取得します：

```json
{
  "id": 0,
  "name": {
    "ja": "西古松南部公園",
    "en": "Nishikomatsu Nanbu Park",
    "ko": "니시코마츠 남부공원",
    "zh": "西古松南部公园"
  },
  "address": "〒700-0973 岡山県岡山市北区下中野",
  "lat": 34.6433,
  "lng": 133.9053,
  "radius": 100,
  "image": "images/location-0.jpg",
  "icon": "🌳"
}
```

### カスタマイズ

- **新しいスポット追加**: `backend/src/server.ts` の `stamps` 配列を編集
- **デザイン変更**: `docs/style.css` を編集
- **言語追加**: `docs/script.js` の `translations` オブジェクトを拡張

## 📱 PWA機能

このアプリはPWA（Progressive Web App）として設計されており：

- **オフライン動作**: 一度読み込めばネット接続なしで利用可能
- **ホーム画面追加**: スマホのホーム画面にアプリとしてインストール
- **プッシュ通知**: 今後の機能拡張で通知機能を追加予定

<!-- 📸 TODO: PWAインストール手順のスクリーンショットをここに追加 -->
<!-- ![PWAインストール](screenshots/pwa-install.png) -->

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

1. **Fork** このリポジトリをFork
2. **Branch** 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. **Commit** 変更をコミット (`git commit -m 'Add amazing feature'`)
4. **Push** ブランチをPush (`git push origin feature/amazing-feature`)
5. **Pull Request** Pull Requestを作成

### 貢献のアイデア

- 新しい観光スポットの追加
- UI/UXの改善
- 多言語サポートの拡充
- アクセシビリティの向上
- パフォーマンスの最適化

## 📄 ライセンス

このプロジェクトは MIT License の下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 👨‍💻 作者

- **nuu1729** - *Initial work* - [nuu1729](https://github.com/nuu1729)

## 🙏 謝辞

- 岡山県観光連盟
- OpenStreetMap コントリビューター
- Leaflet.js 開発チーム

## 📞 お問い合わせ

プロジェクトに関する質問やフィードバックがございましたら、[Issues](https://github.com/nuu1729/Okayama_GPS_RALLY/issues) にお気軽にお寄せください。

---

**楽しい岡山観光をお楽しみください！ 🏯✨**
