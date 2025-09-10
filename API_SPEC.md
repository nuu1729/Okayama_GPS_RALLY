# API仕様書

> 🔌 岡山GPSスタンプラリー バックエンドAPI の詳細仕様

## 📋 目次

1. [API概要](#1-api概要)
2. [認証・セキュリティ](#2-認証・セキュリティ)
3. [エンドポイント仕様](#3-エンドポイント仕様)
4. [データモデル](#4-データモデル)
5. [エラーハンドリング](#5-エラーハンドリング)
6. [パフォーマンス・制限](#6-パフォーマンス・制限)

---

## 1. API概要

### 1.1 基本情報

| 項目 | 内容 |
|------|------|
| **ベースURL** | `http://localhost:3000` (開発) / `https://your-api-domain.com` (本番) |
| **プロトコル** | HTTP/HTTPS |
| **データ形式** | JSON |
| **文字エンコーディング** | UTF-8 |
| **APIバージョン** | v1 |
| **タイムゾーン** | UTC |

### 1.2 共通HTTPヘッダー

#### リクエストヘッダー
```http
Content-Type: application/json
Accept: application/json
User-Agent: Okayama-GPS-Rally-App/1.0
```

#### レスポンスヘッダー
```http
Content-Type: application/json; charset=utf-8
X-API-Version: v1
X-Response-Time: 45ms
Access-Control-Allow-Origin: *
```

### 1.3 APIの設計方針

- **RESTful設計** - リソース指向のURL設計
- **ステートレス** - サーバーは状態を保持しない
- **冪等性** - 同じリクエストを複数回送信しても結果が同じ
- **エラーレスポンスの統一** - 一貫したエラー形式

---

## 2. 認証・セキュリティ

### 2.1 認証方式

現在のバージョンでは、**認証不要**のパブリックAPIとして設計されています。ユーザー識別は`userId`（UUID）で行います。

```javascript
// ユーザー初期化フロー
const response = await fetch('/api/users/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        deviceInfo: navigator.userAgent,
        language: 'ja'
    })
});

const { userId } = await response.json();
// 以降のAPIコールで userId を使用
```

### 2.2 レート制限

| 制限項目 | 制限値 | 時間枠 |
|----------|--------|--------|
| **全エンドポイント** | 100リクエスト | 15分 |
| **スタンプ獲得** | 10回 | 1分 |
| **統計情報取得** | 20回 | 5分 |

#### レート制限時のレスポンス
```json
{
    "success": false,
    "error": "Too Many Requests",
    "retryAfter": 900,
    "limit": 100,
    "remaining": 0
}
```

### 2.3 CORS設定

```javascript
// 許可されるオリジン
const allowedOrigins = [
    'https://nuu1729.github.io',
    'http://localhost:8080',
    'http://127.0.0.1:5500'
];
```

---

## 3. エンドポイント仕様

### 3.1 ヘルスチェック

#### `GET /api/health`

**説明**: サーバーの稼働状況を確認します。

**認証**: 不要

**リクエスト**:
```http
GET /api/health HTTP/1.1
Host: localhost:3000
```

**レスポンス**:
```json
{
    "status": "ok",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "stamps": 4,
    "uptime": 3600,
    "version": "1.0.0",
    "database": "connected"
}
```

**ステータスコード**:
- `200 OK` - サーバー正常
- `503 Service Unavailable` - サーバー異常

---

### 3.2 スタンプデータ取得

#### `GET /api/stamps`

**説明**: 全スタンプラリー地点の情報を取得します。フロントエンドがスタンプデータを動的に取得するために使用されます。

**認証**: 不要

**リクエスト**:
```http
GET /api/stamps HTTP/1.1
Host: localhost:3000
Accept: application/json
```

**レスポンス**:
```json
[
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
        "icon": "🌳",
        "description": {
            "ja": "昭和の面影を残す地域の憩いの場",
            "en": "A community relaxation spot with traces of the Showa era",
            "ko": "쇼와 시대의 흔적이 남아있는 지역 휴식 공간",
            "zh": "保留昭和时代痕迹的社区休憩场所"
        }
    },
    {
        "id": 1,
        "name": {
            "ja": "大元公園",
            "en": "Omoto Park",
            "ko": "오모토 공원",
            "zh": "大元公园"
        },
        "address": "〒700-0927 岡山県岡山市北区西古松250",
        "lat": 34.6427,
        "lng": 133.9089,
        "radius": 100,
        "image": "images/location-1.png",
        "icon": "🌸",
        "description": {
            "ja": "季節のイベントが豊富な地域密着型公園",
            "en": "A community-focused park with abundant seasonal events",
            "ko": "계절별 이벤트가 풍부한 지역 밀착형 공원",
            "zh": "举办丰富季节活动的社区型公园"
        }
    },
    {
        "id": 2,
        "name": {
            "ja": "岡山城",
            "en": "Okayama Castle",
            "ko": "오카야마성",
            "zh": "冈山城"
        },
        "address": "〒700-0823 岡山県岡山市北区丸の内2-3-1",
        "lat": 34.664788,
        "lng": 133.935969,
        "radius": 100,
        "image": "images/location-2.jpg",
        "icon": "🏯",
        "description": {
            "ja": "別名「烏城」、黒い外観が特徴的な歴史的建造物",
            "en": "Also known as 'Ujō', a historic building with distinctive black exterior",
            "ko": "별명 '우죠', 검은 외관이 특징적인 역사적 건조물",
            "zh": "别名"乌城"，以黑色外观为特色的历史建筑"
        }
    },
    {
        "id": 3,
        "name": {
            "ja": "岡山後楽園",
            "en": "Okayama Korakuen",
            "ko": "오카야마 고라쿠엔",
            "zh": "冈山后乐园"
        },
        "address": "〒703-8257 岡山県岡山市北区後楽園1-5",
        "lat": 34.667697,
        "lng": 133.936505,
        "radius": 100,
        "image": "images/location-3.jpg",
        "icon": "🌺",
        "description": {
            "ja": "日本三名園の一つ、回遊式庭園",
            "en": "One of Japan's three famous gardens, a circuit-style garden",
            "ko": "일본 3대 명원 중 하나인 회유식 정원",
            "zh": "日本三大名园之一的回游式庭园"
        }
    }
]
```

**ステータスコード**:
- `200 OK` - 正常取得
- `500 Internal Server Error` - サーバーエラー

---

### 3.3 ユーザー管理

#### `POST /api/users/init`

**説明**: 新しいユーザーを初期化し、一意のユーザーIDを発行します。

**認証**: 不要

**リクエスト**:
```http
POST /api/users/init HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
    "deviceInfo": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
    "language": "ja"
}
```

**リクエストパラメータ**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `deviceInfo` | string | ✅ | ユーザーエージェント文字列 |
| `language` | string | ❌ | 初期言語設定（デフォルト: 'ja'） |

**レスポンス**:
```json
{
    "success": true,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "User initialized successfully",
    "createdAt": "2025-01-15T10:30:00.000Z"
}
```

**エラーレスポンス**:
```json
{
    "success": false,
    "error": "Device info is required",
    "code": "MISSING_DEVICE_INFO"
}
```

**ステータスコード**:
- `200 OK` - ユーザー作成成功
- `400 Bad Request` - 必須パラメータ不足
- `500 Internal Server Error` - サーバーエラー

---

#### `GET /api/users/{userId}/data`

**説明**: 指定したユーザーの獲得済みスタンプデータを取得します。

**認証**: 不要

**パスパラメータ**:
| パラメータ | 型 | 説明 |
|-----------|----|----|
| `userId` | string (UUID) | ユーザー識別子 |

**リクエスト**:
```http
GET /api/users/550e8400-e29b-41d4-a716-446655440000/data HTTP/1.1
Host: localhost:3000
```

**レスポンス**:
```json
{
    "success": true,
    "data": {
        "visitedLocations": [0, 2],
        "lastUpdated": "2025-01-15T10:30:00.000Z",
        "totalStamps": 2,
        "completionRate": 50,
        "stamps": [
            {
                "stamp_id": 0,
                "collected_at": "2025-01-15T09:15:00.000Z",
                "location_lat": 34.6433,
                "location_lng": 133.9053
            },
            {
                "stamp_id": 2,
                "collected_at": "2025-01-15T10:20:00.000Z",
                "location_lat": 34.664788,
                "location_lng": 133.935969
            }
        ]
    }
}
```

**ステータスコード**:
- `200 OK` - データ取得成功
- `400 Bad Request` - 無効なユーザーID
- `404 Not Found` - ユーザーが存在しない
- `500 Internal Server Error` - サーバーエラー

---

### 3.4 スタンプ獲得

#### `POST /api/users/{userId}/stamps/{stampId}`

**説明**: 指定した位置でスタンプを獲得します。位置情報の妥当性を検証し、データベースに記録します。

**認証**: 不要

**パスパラメータ**:
| パラメータ | 型 | 説明 |
|-----------|----|----|
| `userId` | string (UUID) | ユーザー識別子 |
| `stampId` | integer | スタンプID (0-3) |

**リクエスト**:
```http
POST /api/users/550e8400-e29b-41d4-a716-446655440000/stamps/0 HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
    "location": {
        "lat": 34.6433,
        "lng": 133.9053,
        "accuracy": 15.5,
        "timestamp": "2025-01-15T10:30:00.000Z"
    }
}
```

**リクエストパラメータ**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `location.lat` | number | ✅ | 緯度 (-90 ~ 90) |
| `location.lng` | number | ✅ | 経度 (-180 ~ 180) |
| `location.accuracy` | number | ❌ | GPS精度 (メートル) |
| `location.timestamp` | string | ❌ | 位置取得時刻 (ISO 8601) |

**成功レスポンス**:
```json
{
    "success": true,
    "recordId": 123,
    "message": "Stamp collected successfully",
    "collectedAt": "2025-01-15T10:30:00.000Z",
    "stampInfo": {
        "id": 0,
        "name": "西古松南部公園",
        "isFirstTime": true
    }
}
```

**重複獲得レスポンス**:
```json
{
    "success": false,
    "message": "Stamp already collected",
    "recordId": 45,
    "firstCollectedAt": "2025-01-14T15:20:00.000Z"
}
```

**位置不正レスポンス**:
```json
{
    "success": false,
    "error": "Location out of range",
    "code": "LOCATION_OUT_OF_RANGE",
    "details": {
        "requiredRadius": 100,
        "actualDistance": 150.5,
        "stampLocation": {
            "lat": 34.6433,
            "lng": 133.9053
        }
    }
}
```

**ステータスコード**:
- `200 OK` - スタンプ獲得成功
- `200 OK` - 既に獲得済み（success: false）
- `400 Bad Request` - 位置情報不正・範囲外
- `404 Not Found` - 存在しないスタンプID
- `500 Internal Server Error` - サーバーエラー

---

### 3.5 統計情報

#### `GET /api/stats`

**説明**: アプリ全体の利用統計情報を取得します。管理者や分析用途で使用します。

**認証**: 不要

**リクエスト**:
```http
GET /api/stats HTTP/1.1
Host: localhost:3000
```

**レスポンス**:
```json
{
    "success": true,
    "data": {
        "totalUsers": 1245,
        "completedUsers": 156,
        "completionRate": "12.5",
        "totalStampCollections": 3420,
        "averageStampsPerUser": 2.75,
        "stampCounts": [
            {
                "stamp_id": 0,
                "stamp_name": "西古松南部公園",
                "count": 890,
                "percentage": "71.5"
            },
            {
                "stamp_id": 1,
                "stamp_name": "大元公園", 
                "count": 823,
                "percentage": "66.1"
            },
            {
                "stamp_id": 2,
                "stamp_name": "岡山城",
                "count": 1150,
                "percentage": "92.4"
            },
            {
                "stamp_id": 3,
                "stamp_name": "岡山後楽園",
                "count": 1095,
                "percentage": "88.0"
            }
        ],
        "dailyStats": {
            "today": {
                "newUsers": 25,
                "stampsCollected": 67
            },
            "yesterday": {
                "newUsers": 32,
                "stampsCollected": 89
            }
        },
        "lastUpdated": "2025-01-15T10:30:00.000Z"
    }
}
```

**ステータスコード**:
- `200 OK` - 統計取得成功
- `500 Internal Server Error` - サーバーエラー

---

## 4. データモデル

### 4.1 Stampモデル

```typescript
interface Stamp {
    id: number;                    // スタンプID (0-3)
    name: LocalizedString;         // 多言語対応名称
    address: string;               // 住所
    lat: number;                   // 緯度
    lng: number;                   // 経度
    radius: number;                // 獲得判定半径（メートル）
    image: string;                 // 画像パス
    icon: string;                  // 絵文字アイコン
    description?: LocalizedString; // 説明文（オプション）
}

interface LocalizedString {
    ja: string;    // 日本語
    en: string;    // 英語  
    ko: string;    // 韓国語
    zh: string;    // 中国語
}
```

### 4.2 Userモデル

```typescript
interface User {
    id: string;                 // UUID v4
    deviceInfo: string;         // User-Agent文字列
    language: string;           // 言語設定 (ja|en|ko|zh)
    createdAt: Date;           // 作成日時
    lastActive: Date;          // 最終アクティブ日時
}
```

### 4.3 UserStampモデル

```typescript
interface UserStamp {
    id: number;                // レコードID (自動採番)
    userId: string;            // ユーザーID (UUID)
    stampId: number;           // スタンプID
    collectedAt: Date;         // 獲得日時
    locationLat: number;       // 獲得時の緯度
    locationLng: number;       // 獲得時の経度
}
```

### 4.4 データベース設計

```sql
-- ユーザーテーブル
CREATE TABLE users (
    id TEXT PRIMARY KEY,                    -- UUID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    device_info TEXT,                       -- User-Agent
    language TEXT DEFAULT 'ja'              -- 言語設定
);

-- ユーザースタンプ獲得テーブル
CREATE TABLE user_stamps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,                           -- users.id への外部キー
    stamp_id INTEGER,                       -- スタンプID (0-3)
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    location_lat REAL,                      -- 獲得時緯度
    location_lng REAL,                      -- 獲得時経度
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- インデックス
CREATE INDEX idx_user_stamps_user_id ON user_stamps(user_id);
CREATE INDEX idx_user_stamps_stamp_id ON user_stamps(stamp_id);
CREATE INDEX idx_user_stamps_collected_at ON user_stamps(collected_at);
```

---

## 5. エラーハンドリング

### 5.1 エラーレスポンス形式

すべてのエラーレスポンスは以下の統一形式で返却されます：

```json
{
    "success": false,
    "error": "Human readable error message",
    "code": "ERROR_CODE",
    "details": {
        "field": "validation details",
        "timestamp": "2025-01-15T10:30:00.000Z"
    }
}
```

### 5.2 エラーコード一覧

| HTTPステータス | エラーコード | 説明 | 対処法 |
|-------------|------------|------|--------|
| `400` | `MISSING_DEVICE_INFO` | deviceInfo が未指定 | リクエストボディに deviceInfo を含める |
| `400` | `INVALID_USER_ID` | 不正なUUID形式 | 正しいUUID形式で送信 |
| `400` | `INVALID_STAMP_ID` | 存在しないスタンプID | 0-3の範囲でスタンプIDを指定 |
| `400` | `INVALID_LOCATION` | 不正な位置情報 | 緯度経度の形式を確認 |
| `400` | `LOCATION_OUT_OF_RANGE` | スタンプ獲得範囲外 | 指定地点に近づいてから再試行 |
| `404` | `USER_NOT_FOUND` | ユーザーが存在しない | ユーザー初期化を実行 |
| `404` | `STAMP_NOT_FOUND` | スタンプが存在しない | 正しいスタンプIDを指定 |
| `429` | `RATE_LIMIT_EXCEEDED` | レート制限超過 | 時間を置いて再試行 |
| `500` | `DATABASE_ERROR` | データベースエラー | サーバー管理者に連絡 |
| `500` | `INTERNAL_ERROR` | 内部サーバーエラー | サーバー管理者に連絡 |

### 5.3 クライアント側エラーハンドリング例

```javascript
async function collectStamp(userId, stampId, location) {
    try {
        const response = await fetch(`/api/users/${userId}/stamps/${stampId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            switch (data.code) {
                case 'LOCATION_OUT_OF_RANGE':
                    showMessage(`あと${Math.round(data.details.actualDistance - data.details.requiredRadius)}m近づいてください`);
                    break;
                case 'RATE_LIMIT_EXCEEDED':
                    showMessage('しばらく時間を置いてから再試行してください');
                    break;
                default:
                    showMessage(`エラー: ${data.error}`);
            }
            return { success: false };
        }
        
        if (!data.success && data.message === 'Stamp already collected') {
            showMessage('このスタンプは既に獲得済みです');
            return { success: false, alreadyCollected: true };
        }
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Network error:', error);
        showMessage('ネットワークエラーが発生しました');
        return { success: false, networkError: true };
    }
}
```

---

## 6. パフォーマンス・制限

### 6.1 リクエスト制限

| 制限項目 | 制限値 | 備考 |
|----------|--------|------|
| **リクエストサイズ** | 1MB | JSON本体のサイズ |
| **レスポンス時間** | 30秒 | タイムアウト値 |
| **同時接続数** | 1000 | サーバー全体 |
| **データベースプール** | 20接続 | SQLite制限 |

### 6.2 キャッシュ戦略

```javascript
// レスポンスキャッシュ設定
app.get('/api/stamps', (req, res) => {
    res.set({
        'Cache-Control': 'public, max-age=3600',  // 1時間キャッシュ
        'ETag': generateETag(stampsData),         // 条件付きリクエスト対応
        'Last-Modified': stampsLastModified
    });
    res.json(stampsData);
});

// ユーザーデータは短期キャッシュ
app.get('/api/users/:id/data', (req, res) => {
    res.set({
        'Cache-Control': 'private, max-age=60',   // 1分キャッシュ
        'Vary': 'User-Agent'
    });
    // データ取得処理...
});
```

### 6.3 パフォーマンス監視

```typescript
// リクエスト処理時間の計測
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${duration}ms`);
        
        // 遅いリクエストをログ出力
        if (duration > 1000) {
            console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
        }
    });
    
    next();
});
```

### 6.4 データベース最適化

```sql
-- クエリパフォーマンス最適化
-- よく使用されるクエリのインデックス
EXPLAIN QUERY PLAN 
SELECT * FROM user_stamps 
WHERE user_id = ? AND stamp_id = ?;

-- 統計情報取得の最適化
CREATE INDEX idx_user_stamps_composite ON user_stamps(user_id, stamp_id, collected_at);

-- データベースの最適化設定
PRAGMA optimize;
PRAGMA vacuum;
ANALYZE;
```

---

## 🔧 開発者向け情報

### API テスト例

```bash
# ヘルスチェック
curl -X GET http://localhost:3000/api/health

# スタンプデータ取得
curl -X GET http://localhost:3000/api/stamps

# ユーザー初期化
curl -X POST http://localhost:3000/api/users/init \
  -H "Content-Type: application/json" \
  -d '{"deviceInfo": "test-device", "language": "ja"}'

# スタンプ獲得
curl -X POST http://localhost:3000/api/users/{userId}/stamps/0 \
  -H "Content-Type: application/json" \
  -d '{"location": {"lat": 34.6433, "lng": 133.9053}}'
```

### 環境変数

```bash
# .env ファイル
PORT=3000
CORS_ORIGINS=http://localhost:8080,https://your-domain.com
DATABASE_PATH=./data/stamps.db
LOG_LEVEL=info
NODE_ENV=development
```

---

このAPI仕様書により、フロントエンド開発者はバックエンドとの連携を効率的に実装でき、将来的な機能拡張も円滑に行えます。
