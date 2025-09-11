// backend/src/server.ts
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import database from './database';

const app = express();

// CORS設定（より具体的に）
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:8080', 'http://127.0.0.1:5500'],
  credentials: true
}));

app.use(express.json());
const PORT = process.env.PORT || 3000;

// JSONファイルからスタンプデータを読み込む
const stampsPath = path.join(__dirname, "../data/stamps.json");
let stamps: any[] = [];

try {
  if (fs.existsSync(stampsPath)) {
    stamps = JSON.parse(fs.readFileSync(stampsPath, "utf-8"));
    console.log(`✅ Loaded ${stamps.length} stamps from JSON file`);
  } else {
    console.warn("⚠️ Stamps JSON file not found, using empty array");
    stamps = [];
  }
} catch (error) {
  console.error("❌ Error loading stamps data:", error);
  stamps = [];
}

// ===== ヘルスチェックエンドポイント =====
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    stamps: stamps.length
  });
});

// ===== スタンプデータAPI =====
app.get("/api/stamps", (req, res) => {
  res.json(stamps);
});

// ===== ユーザー管理API =====

// ユーザー初期化
app.post("/api/users/init", async (req, res) => {
  try {
    const { deviceInfo, language } = req.body;

    if (!deviceInfo) {
      return res.status(400).json({
        success: false,
        error: "Device info is required"
      });
    }

    const userId = await database.createUser(deviceInfo, language || 'ja');

    console.log(`✅ New user created: ${userId.substring(0, 8)}...`);

    res.json({
      success: true,
      userId: userId,
      message: "User initialized successfully"
    });
  } catch (error: any) {
    console.error('❌ User init error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create user"
    });
  }
});

// ユーザーデータ取得
app.get("/api/users/:userId/data", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    // アクティビティ更新
    await database.updateUserActivity(userId);

    const stamps = await database.getUserStamps(userId);
    const visitedLocations = stamps.map((stamp: any) => stamp.stamp_id);
    const lastUpdated = stamps.length > 0
      ? Math.max(...stamps.map((s: any) => new Date(s.collected_at).getTime()))
      : null;

    res.json({
      success: true,
      data: {
        visitedLocations,
        lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
        totalStamps: stamps.length,
        stamps: stamps
      }
    });
  } catch (error: any) {
    console.error('❌ Get user data error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get user data"
    });
  }
});

// スタンプ獲得記録
app.post("/api/users/:userId/stamps/:stampId", async (req, res) => {
  try {
    const { userId, stampId } = req.params;
    const { location } = req.body;

    if (!userId || !stampId) {
      return res.status(400).json({
        success: false,
        error: "User ID and Stamp ID are required"
      });
    }

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return res.status(400).json({
        success: false,
        error: "Valid location (lat, lng) is required"
      });
    }

    const result = await database.collectStamp(userId, parseInt(stampId), location);

    if (result.alreadyCollected) {
      console.log(`ℹ️ Stamp ${stampId} already collected by user ${userId.substring(0, 8)}...`);
      return res.json({
        success: false,
        message: "Stamp already collected",
        recordId: result.id
      });
    }

    console.log(`✅ Stamp ${stampId} collected by user ${userId.substring(0, 8)}...`);

    res.json({
      success: true,
      recordId: result.id,
      message: "Stamp collected successfully"
    });
  } catch (error: any) {
    console.error('❌ Collect stamp error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to collect stamp"
    });
  }
});

// ===== デバッグ用API =====
// ユーザーの全スタンプデータを削除する
app.delete("/api/debug/reset-data", async (req, res) => {
    try {
        const deletedCount = await database.deleteAllStamps();
        console.log(`✅ Debug: Deleted all stamp records (${deletedCount} records)`);
        res.json({
            success: true,
            message: `Successfully deleted all stamp data.`,
            deletedCount: deletedCount
        });
    } catch (error: any) {
        console.error('❌ Debug reset error:', error);
        res.status(500).json({
            success: false,
            error: error.message || "Failed to reset data"
        });
    }
});


// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

// エラーハンドラー
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: "Internal server error"
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏯 Stamps API: http://localhost:${PORT}/api/stamps`);
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  database.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  database.close();
  process.exit(0);
});
