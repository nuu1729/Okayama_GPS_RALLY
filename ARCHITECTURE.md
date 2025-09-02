# システム構成とファイル構造

### 1. システム構成図
本アプリケーションのシステム構成は、フロントエンドとバックエンドが分離されたSPA（Single Page Application）構成となっています。
- フロントエンド: GitHub Pages上でホストされるSPA。HTML, CSS, JavaScriptで構成され、PWAに対応しています。

- バックエンド: Node.jsとExpress.jsで構築されたシンプルなAPIサーバー。スタンプラリーの地点データをJSON形式で提供します。

    ![代替テキスト](./docs/images/システム構成図.png)

### 2. 詳細ファイル構成
本プロジェクトは、フロントエンド（`docs/`）とバックエンド（`backend/`）の2つの主要なディレクトリで構成されています。

```
Okayama_GPS_RALLY/
├── 📁 backend/                    # バックエンドAPI
│   ├── 📁 src/
│   │   └── 📄 server.ts          # Express.jsサーバーとデータ定義
│   ├── 📄 package.json           # 依存関係定義
│   ├── 📄 tsconfig.json          # TypeScript設定
│   └── 📁 dist/                  # ビルド成果物
│
├── 📁 docs/                       # フロントエンド（GitHub Pages用）
│   ├── 📄 index.html             # メインHTML（PWA Manifest込み）
│   ├── 📄 script.js              # 全体ロジック（2500行以上）
│   ├── 📄 style.css              # 全体スタイル
│   ├── 📄 sw.js                  # Service Worker（オフライン機能）
│   ├── 📄 manifest.json          # PWA設定ファイル
│   │
│   ├── 📁 images/                # 画像リソース
│   │   ├── 🖼️ background.jpg     # メイン背景画像
│   │   └── 🖼️ location-*.jpg/png # 観光地画像
│   │
│   ├── 📁 icons/                 # PWA用アイコン
│   │   └── 🎯 icon-*.png         # PWAアイコン
│   │
│   └── 📁 Sounds/                # オーディオファイル
│       └── 🎵 *.mp3             # BGM・効果音
│
└── 📄 README.md                   # プロジェクト概要
```