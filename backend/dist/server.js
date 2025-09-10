"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("./database"));
const app = (0, express_1.default)();
// CORS設定（より具体的に）
app.use((0, cors_1.default)({
    origin: ['http://localhost:3001', 'http://localhost:8080', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express_1.default.json());
const PORT = process.env.PORT || 3000;
// JSONファイルからスタンプデータを読み込む
const stampsPath = path_1.default.join(__dirname, "../data/stamps.json");
let stamps = [];
try {
    if (fs_1.default.existsSync(stampsPath)) {
        stamps = JSON.parse(fs_1.default.readFileSync(stampsPath, "utf-8"));
        console.log(`✅ Loaded ${stamps.length} stamps from JSON file`);
    }
    else {
        console.warn("⚠️ Stamps JSON file not found, using empty array");
        stamps = [];
    }
}
catch (error) {
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
        const userId = await database_1.default.createUser(deviceInfo, language || 'ja');
        console.log(`✅ New user created: ${userId.substring(0, 8)}...`);
        res.json({
            success: true,
            userId: userId,
            message: "User initialized successfully"
        });
    }
    catch (error) {
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
        await database_1.default.updateUserActivity(userId);
        const stamps = await database_1.default.getUserStamps(userId);
        const visitedLocations = stamps.map((stamp) => stamp.stamp_id);
        const lastUpdated = stamps.length > 0
            ? Math.max(...stamps.map((s) => new Date(s.collected_at).getTime()))
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
    }
    catch (error) {
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
        const result = await database_1.default.collectStamp(userId, parseInt(stampId), location);
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
    }
    catch (error) {
        console.error('❌ Collect stamp error:', error);
        res.status(500).json({
            success: false,
            error: error.message || "Failed to collect stamp"
        });
    }
});
// 統計情報取得
app.get("/api/stats", async (req, res) => {
    try {
        const stats = await database_1.default.getStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('❌ Get stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message || "Failed to get stats"
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
app.use((err, req, res, next) => {
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
    database_1.default.close();
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    database_1.default.close();
    process.exit(0);
});
