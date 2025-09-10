# システム構成とファイル構造

## 📋 目次

1. [システム概要](#1-システム概要)
2. [技術アーキテクチャ](#2-技術アーキテクチャ)
3. [詳細ファイル構成](#3-詳細ファイル構成)
4. [データフロー](#4-データフロー)
5. [API通信フロー](#5-api通信フロー)
6. [パフォーマンス考慮事項](#6-パフォーマンス考慮事項)

---

## 1. システム概要

本アプリケーションは、**フロントエンド（SPA）**　と　**バックエンド（API サーバー）**が分離されたモダンなWebアプリケーション構成を採用しています。PWA（Progressive Web App）として動作し、オフライン機能も提供します。

### 1.1 システム構成図

```mermaid
graph TB
    subgraph "ユーザーデバイス"
        A[ブラウザ/PWAアプリ]
        B[Service Worker]
        C[Local Storage]
        D[GPS/Geolocation API]
        E[Camera API<br/>（将来拡張）]
    end
    
    subgraph "CDN/静的ホスティング"
        F[GitHub Pages]
        G[Static Assets<br/>HTML/CSS/JS/Images]
    end
    
    subgraph "バックエンドサーバー"
        H[Express.js API Server]
        I[SQLite Database]
        J[JSON Data Files]
    end
    
    subgraph "外部サービス"
        K[Leaflet/OpenStreetMap]
        L[Web Audio API]
    end
    
    A --> F
    F --> G
    A <--> H
    H <--> I
    H --> J
    A --> B
    A --> C
    A --> D
    A --> K
    A --> L
    B --> C
    
    style A fill:#e1f5fe
    style H fill:#f3e5f5
    style I fill:#fff3e0
    style F fill:#e8f5e8
```

### 1.2 主要コンポーネント

| コンポーネント | 技術 | 役割 | ホスティング |
|---------------|------|------|-------------|
| **フロントエンド** | HTML/CSS/JavaScript | UI/UX、GPS処理、地図表示 | GitHub Pages |
| **バックエンド** | Node.js + Express.js | API提供、データ管理 | Heroku/Railway |
| **データベース** | SQLite | ユーザーデータ、統計情報 | バックエンドサーバー |
| **地図サービス** | Leaflet.js + OpenStreetMap | インタラクティブマップ | CDN |
| **PWA機能** | Service Worker | オフライン対応、キャッシュ | ブラウザ |

---

## 2. 技術アーキテクチャ

### 2.1 フロントエンド アーキテクチャ

![フロントエンドアーキテクチャ図](./docs/images/frontend_arch.png)


### 2.2 バックエンド アーキテクチャ

![フロントエンドアーキテクチャ図](./docs/images/backend_arch.png)

---

## 3. 詳細ファイル構成

### 3.1 プロジェクト全体構造

```
Okayama_GPS_RALLY/
├── 📁 backend/                           # バックエンドAPI
│   ├── 📁 src/                          # TypeScriptソースコード
│   │   ├── 📄 server.ts                 # メインサーバーファイル
│   │   ├── 📄 database.ts               # データベースアクセス層
│   │   └── 📁 models/                   # データモデル
│   │       ├── 📄 User.js               # ユーザーモデル
│   │       └── 📄 UserStamp.js          # ユーザースタンプモデル
│   │
│   ├── 📁 data/                         # データファイル
│   │   ├── 📄 stamps.json               # スタンプポイントデータ
│   │   └── 📄 stamps.db                 # SQLiteデータベース（実行時生成）
│   │
│   ├── 📁 dist/                         # TypeScriptビルド成果物
│   │   └── 📄 server.js                 # コンパイル済みJS
│   │
│   ├── 📄 package.json                  # 依存関係・スクリプト定義
│   ├── 📄 tsconfig.json                 # TypeScript設定
│   └── 📄 .env.example                  # 環境変数テンプレート
│
├── 📁 docs/                             # フロントエンド（GitHub Pages用）
│   ├── 📄 index.html                    # メインHTML（PWA Manifest含む）
│   ├── 📄 script.js                     # 全体ロジック（2500行以上）
│   ├── 📄 style.css                     # 全体スタイル（レスポンシブ対応）
│   ├── 📄 sw.js                         # Service Worker（オフライン機能）
│   ├── 📄 manifest.json                 # PWA設定ファイル
│   │
│   ├── 📁 images/                       # 画像リソース
│   │   ├── 🖼️ background.jpg           # メイン背景画像
│   │   ├── 🖼️ location-0.jpg           # 西古松南部公園
│   │   ├── 🖼️ location-1.png           # 大元公園
│   │   ├── 🖼️ location-2.jpg           # 岡山城
│   │   ├── 🖼️ location-3.jpg           # 岡山後楽園
│   │   ├── 🖼️ メイン画面.png           # スクリーンショット
│   │   ├── 🖼️ 獲得前.png               # UI状態デモ
│   │   └── 🖼️ 獲得後.png               # UI状態デモ
│   │
│   ├── 📁 icons/                        # PWA用アイコン
│   │   ├── 🎯 icon-192.png             # PWAアイコン（小）
│   │   └── 🎯 icon-512.png             # PWAアイコン（大）
│   │
│   └── 📁 Sounds/                       # オーディオファイル
│       └── 🎵 BGM.mp3                  # 背景音楽・効果音
│
├── 📄 README.md                         # プロジェクト概要・使用方法
├── 📄 ARCHITECTURE.md                   # システム構成詳細（本ファイル）
├── 📄 API_SPEC.md                       # API仕様書
└── 📄 企画設計書.md                     # プロジェクト企画・設計背景
```

### 3.2 ファイル詳細説明

#### 🎯 主要ファイル

| ファイル | 役割 | サイズ目安 | 重要度 |
|---------|------|-----------|--------|
| `docs/script.js` | フロントエンドメインロジック | 2500+ 行 | ★★★★★ |
| `docs/style.css` | 全体スタイル・レスポンシブ | 800+ 行 | ★★★★☆ |
| `backend/src/server.ts` | Express APIサーバー | 300+ 行 | ★★★★★ |
| `backend/src/database.ts` | DB操作・データ管理 | 400+ 行 | ★★★★☆ |
| `docs/sw.js` | PWA・オフライン機能 | 150+ 行 | ★★★☆☆ |

#### 🎨 スタイル構成

```css
/* style.css の構成 */
:root { /* CSS変数定義 */ }
* { /* リセットCSS */ }

/* === コンポーネント別スタイル === */
.header { /* ヘッダー・進捗表示 */ }
.nav-tabs { /* ナビゲーションタブ */ }
.location-card { /* スタンプ地点カード */ }
.collection-grid { /* コレクション表示 */ }

/* === ユーティリティ === */
.debug-controls { /* デバッグ機能 */ }
.language-selector { /* 多言語切り替え */ }

/* === レスポンシブ === */
@media (max-width: 768px) { /* モバイル対応 */ }
@media (max-width: 480px) { /* 小型デバイス対応 */ }

/* === ダークモード === */
[data-theme="dark"] { /* ダークテーマ */ }
```

#### 🔧 JavaScript構成

```javascript
// script.js の主要機能構成

/* === グローバル変数・設定 === */
const BACKEND_URL = 'http://localhost:3000';
let currentPosition = null;
let locations = [];

/* === 初期化・セットアップ === */
function initializeApp() { /* アプリ初期化 */ }
function loadStampData() { /* スタンプデータ読み込み */ }
function setupEventListeners() { /* イベントリスナー設定 */ }

/* === GPS・位置情報 === */
function startGPSTracking() { /* GPS追跡開始 */ }
function calculateDistance() { /* 距離計算（Haversine） */ }
function updateDistances() { /* 距離表示更新 */ }

/* === スタンプ機能 === */
function checkLocation(locationId) { /* スタンプ獲得判定 */ }
function collectStamp(locationId) { /* スタンプ獲得処理 */ }
function updateProgress() { /* 進捗更新 */ }

/* === UI・画面制御 === */
function switchTab(tabName) { /* タブ切り替え */ }
function updateLocationCards() { /* カード表示更新 */ }
function showCollectionCards() { /* コレクション表示 */ }

/* === 多言語・テーマ === */
function changeLanguage() { /* 言語切り替え */ }
function toggleTheme() { /* ダークモード切り替え */ }

/* === 地図機能 === */
function initializeMap() { /* Leaflet地図初期化 */ }
function updateMapMarkers() { /* マーカー更新 */ }

/* === データ管理 === */
function saveToLocalStorage() { /* ローカル保存 */ }
function loadFromLocalStorage() { /* ローカル読み込み */ }
function syncWithBackend() { /* バックエンド同期 */ }
```

---

## 4. データフロー

### 4.1 アプリケーション起動フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant B as ブラウザ
    participant SW as Service Worker
    participant LS as Local Storage
    participant API as Backend API
    participant DB as Database

    U->>B: アプリにアクセス
    B->>SW: Service Worker確認
    SW-->>B: キャッシュからリソース提供
    
    B->>LS: 保存済み設定読み込み
    LS-->>B: 言語設定、テーマ、スタンプ状態
    
    B->>API: スタンプデータ要求
    API->>DB: データベースクエリ
    DB-->>API: スタンプ情報
    API-->>B: JSON レスポンス
    
    Note over B: フォールバック処理
    alt API接続失敗
        B->>B: ローカルデフォルトデータ使用
    end
    
    B->>B: UI初期化・地図表示
    B->>U: アプリ準備完了
```

### 4.2 スタンプ獲得フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant GPS as GPS API
    participant B as ブラウザ
    participant API as Backend API
    participant DB as Database
    participant LS as Local Storage

    loop リアルタイム追跡
        B->>GPS: 現在位置要求
        GPS-->>B: 緯度・経度
        B->>B: 距離計算・UI更新
    end
    
    U->>B: 「スタンプ獲得」ボタンタップ
    B->>GPS: 最終位置確認
    GPS-->>B: 現在位置
    
    alt 範囲内判定
        B->>B: スタンプ獲得処理
        B->>LS: ローカル保存
        B->>API: スタンプ獲得記録
        API->>DB: ユーザーデータ更新
        DB-->>API: 成功レスポンス
        API-->>B: 獲得確認
        B->>B: UI更新・効果音再生
        B->>U: 獲得成功メッセージ
    else 範囲外判定
        B->>U: 「もっと近づいて」警告
    end
```

### 4.3 オフライン動作フロー

```mermaid
graph TD
    A[ユーザーアクション] --> B{ネットワーク状態}
    
    B -->|オンライン| C[通常処理]
    C --> D[API通信]
    D --> E[レスポンス受信]
    E --> F[UI更新]
    
    B -->|オフライン| G[オフライン処理]
    G --> H{Service Worker}
    H -->|キャッシュあり| I[キャッシュから提供]
    H -->|キャッシュなし| J[フォールバック処理]
    
    I --> K[ローカルデータ使用]
    J --> K
    K --> L[Local Storage更新]
    L --> M[UI更新]
    
    M --> N{再接続時}
    N -->|オンライン復帰| O[同期処理]
    O --> P[バックエンド更新]
    
    style B fill:#fff2cc
    style H fill:#d4edda
    style N fill:#f8d7da
```

---

## 5. デプロイメント構成

### 5.1 本番環境アーキテクチャ

```mermaid
graph TB
    subgraph "CDN/Edge"
        CDN[GitHub Pages<br/>静的ホスティング]
    end
    
    subgraph "Production Backend"
        LB[Load Balancer]
        API1[API Server 1]
        API2[API Server 2]
        DB[(SQLite/PostgreSQL)]
    end
    
    subgraph "Monitoring"
        MON[監視システム]
        LOG[ログ収集]
    end
    
    CDN --> LB
    LB --> API1
    LB --> API2
    API1 --> DB
    API2 --> DB
    API1 --> LOG
    API2 --> LOG
    MON --> API1
    MON --> API2
```

### 5.2 環境別構成

| 環境 | フロントエンド | バックエンド | データベース | 用途 |
|------|-------------|------------|-------------|------|
| **開発** | localhost:8080 | localhost:3000 | SQLite | 開発・テスト |
| **ステージング** | GitHub Pages | Heroku/Railway | SQLite | 統合テスト |
| **本番** | GitHub Pages | AWS/GCP | PostgreSQL | 一般ユーザー |

### 5.3 CI/CD パイプライン

```yaml
# .github/workflows/deploy.yml（概念図）
name: Deploy
on:
  push:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GitHub Pages
        run: # 自動デプロイ
        
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build TypeScript
        run: npm run build
      - name: Deploy to Railway
        run: # 自動デプロイ
```

---

## 6. パフォーマンス・セキュリティ

### 6.1 パフォーマンス最適化戦略

#### フロントエンド最適化
```javascript
// GPS更新の最適化
const GPS_CONFIG = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000  // 30秒キャッシュ
};

// 関数のスロットリング
const throttledUpdate = throttle(updateDistances, 2000);

// 画像遅延読み込み
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            imageObserver.unobserve(img);
        }
    });
});
```

#### Service Workerキャッシュ戦略
```javascript
// キャッシュ戦略の定義
const CACHE_STRATEGIES = {
    static: 'cache-first',      // HTML,CSS,JS
    images: 'cache-first',      // 画像ファイル
    api: 'network-first',       // API通信
    fallback: 'stale-while-revalidate'  // フォールバック
};
```

### 6.2 セキュリティ対策

#### バックエンドセキュリティ
```typescript
// レート制限
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100,                 // 最大100リクエスト
    message: 'Too many requests'
});

// CORS設定
const corsOptions = {
    origin: process.env.CORS_ORIGINS?.split(',') || [],
    credentials: true,
    optionsSuccessStatus: 200
};

// 入力値検証
const validateStampData = [
    body('location.lat').isFloat({min: -90, max: 90}),
    body('location.lng').isFloat({min: -180, max: 180}),
    body('stampId').isInt({min: 0})
];
```

#### フロントエンドセキュリティ
- **Content Security Policy (CSP)** 実装
- **XSS対策** - DOMPurifyライブラリ使用検討
- **データ検証** - 位置情報の妥当性確認
- **プライバシー保護** - 個人識別情報の最小化

### 6.3 監視・運用項目

| 項目 | 目標値 | 監視方法 | アラート条件 |
|------|--------|----------|-------------|
| **応答時間** | < 1秒 | APM | > 3秒で警告 |
| **可用性** | 99.9% | Uptime監視 | 5分以上ダウン |
| **エラー率** | < 1% | ログ監視 | > 5%で警告 |
| **GPS精度** | 90%以上 | アプリ内統計 | 週次レポート |

### 6.4 データバックアップ戦略

```bash
# 自動バックアップスクリプト例
#!/bin/bash
# データベースバックアップ
sqlite3 /app/data/stamps.db ".backup /backups/stamps_$(date +%Y%m%d_%H%M%S).db"

# ログファイルローテーション
find /app/logs -name "*.log" -mtime +7 -delete

# 統計データエクスポート
curl -s http://localhost:3000/api/stats > /backups/stats_$(date +%Y%m%d).json
```

---

## 💡 技術選定の理由

### アーキテクチャ選定理由

| 技術 | 選定理由 | 代替案 |
|------|----------|--------|
| **HTML/CSS/JS** | 軽量・高速、PWA対応 | React, Vue.js |
| **Express.js** | シンプル、Node.js生態系 | FastAPI, Spring Boot |
| **SQLite** | 軽量、ファイルベース | PostgreSQL, MySQL |
| **GitHub Pages** | 無料、簡単デプロイ | Vercel, Netlify |
| **Leaflet.js** | オープンソース、軽量 | Google Maps, Mapbox |

### スケーラビリティ考慮

```mermaid
graph LR
    subgraph "現在（MVP）"
        A[Single Server]
        B[SQLite]
        C[~1000 users]
    end
    
    subgraph "拡張段階1"
        D[Load Balanced]
        E[PostgreSQL]
        F[~10k users]
    end
    
    subgraph "拡張段階2"
        G[Microservices]
        H[Redis Cache]
        I[CDN]
        J[~100k users]
    end
    
    A --> D --> G
    B --> E --> H
    C --> F --> J
```

