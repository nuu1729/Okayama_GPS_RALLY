// src/server.ts
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json()); // JSON parsing middleware
const PORT = 3000;

// データベースのインポート（requireを使用）
const database = require('./database');

// JSONファイルからスタンプデータを読み込む
const stampsPath = path.join(__dirname, "../data/stamps.json");
let stamps: any[] = [];

try {
  stamps = JSON.parse(fs.readFileSync(stampsPath, "utf-8"));
} catch (error) {
  console.error("スタンプデータの読み込みに失敗:", error);
  stamps = []; // フォールバック
}

// APIエンドポイント
app.get("/api/stamps", (req, res) => {
    res.json(stamps);
});

// === ユーザー管理API ===

// ユーザー初期化
app.post("/api/users/init", async (req, res) => {
  try {
    const { deviceInfo, language } = req.body;
    const userId = await database.createUser(deviceInfo, language);
    
    res.json({
      success: true,
      userId: userId,
      message: "User initialized successfully"
    });
  } catch (error: any) {
    console.error('User init error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ユーザーデータ取得
app.get("/api/users/:userId/data", async (req, res) => {
  try {
    const { userId } = req.params;
    
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
    console.error('Get user data error:', error);
    res.status(500).json({
      success: false, 
      error: error.message
    });
  }
});

// スタンプ獲得記録
app.post("/api/users/:userId/stamps/:stampId", async (req, res) => {
  try {
    const { userId, stampId } = req.params;
    const { location } = req.body;
    
    const result = await database.collectStamp(userId, parseInt(stampId), location);
    
    if (result.alreadyCollected) {
      return res.json({
        success: false,
        message: "Stamp already collected",
        recordId: result.id
      });
    }
    
    res.json({
      success: true,
      recordId: result.id,
      message: "Stamp collected successfully"
    });
  } catch (error: any) {
    console.error('Collect stamp error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 統計情報取得
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await database.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`✅ Backend running at http://localhost:${PORT}`);
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  database.close();
  process.exit(0);
});
