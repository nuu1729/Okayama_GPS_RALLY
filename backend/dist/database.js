"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/database.ts
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
class Database {
    constructor() {
        // データディレクトリの確認・作成
        const dataDir = path_1.default.join(__dirname, "../data");
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
            console.log("✅ Created data directory:", dataDir);
        }
        const dbPath = path_1.default.join(dataDir, "stamps.db");
        console.log("🗄️ Database path:", dbPath);
        this.db = new sqlite3_1.default.Database(dbPath, (err) => {
            if (err) {
                console.error("❌ Database connection failed:", err);
                throw err;
            }
            else {
                console.log("✅ Connected to SQLite database");
            }
        });
        this.init();
    }
    init() {
        this.db.serialize(() => {
            // ユーザーテーブル
            this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
          device_info TEXT,
          language TEXT DEFAULT 'ja'
        )
      `, (err) => {
                if (err) {
                    console.error("❌ Error creating users table:", err);
                }
                else {
                    console.log("✅ Users table ready");
                }
            });
            // ユーザースタンプテーブル
            this.db.run(`
        CREATE TABLE IF NOT EXISTS user_stamps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          stamp_id INTEGER,
          collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          location_lat REAL,
          location_lng REAL,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
                if (err) {
                    console.error("❌ Error creating user_stamps table:", err);
                }
                else {
                    console.log("✅ User_stamps table ready");
                }
            });
            // インデックス作成
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_user_stamps_user_id ON user_stamps(user_id)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_user_stamps_stamp_id ON user_stamps(stamp_id)`);
            console.log("✅ Database initialization completed");
        });
    }
    async createUser(deviceInfo, language = "ja") {
        return new Promise((resolve, reject) => {
            const userId = (0, uuid_1.v4)();
            this.db.run(`INSERT INTO users (id, device_info, language) VALUES (?, ?, ?)`, [userId, deviceInfo, language], function (err) {
                if (err) {
                    console.error("❌ Create user failed:", err);
                    reject(err);
                }
                else {
                    console.log(`✅ User created: ${userId.substring(0, 8)}...`);
                    resolve(userId);
                }
            });
        });
    }
    async updateUserActivity(userId) {
        return new Promise((resolve, reject) => {
            this.db.run(`UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?`, [userId], function (err) {
                if (err) {
                    console.error("❌ Update user activity failed:", err);
                    reject(err);
                }
                else {
                    resolve(this.changes ?? 0);
                }
            });
        });
    }
    async collectStamp(userId, stampId, location) {
        return new Promise((resolve, reject) => {
            // まず既存の記録をチェック
            this.db.get(`SELECT id FROM user_stamps WHERE user_id = ? AND stamp_id = ?`, [userId, stampId], (err, row) => {
                if (err) {
                    console.error("❌ Check stamp failed:", err);
                    reject(err);
                    return;
                }
                if (row) {
                    // 既に獲得済み
                    resolve({ alreadyCollected: true, id: row.id });
                    return;
                }
                // 新規記録を挿入
                this.db.run(`INSERT INTO user_stamps (user_id, stamp_id, location_lat, location_lng) 
             VALUES (?, ?, ?, ?)`, [userId, stampId, location.lat, location.lng], function (err) {
                    if (err) {
                        console.error("❌ Collect stamp failed:", err);
                        reject(err);
                    }
                    else {
                        console.log(`✅ Stamp ${stampId} collected by user ${userId.substring(0, 8)}...`);
                        resolve({ alreadyCollected: false, id: this.lastID });
                    }
                });
            });
        });
    }
    async getUserStamps(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT stamp_id, collected_at, location_lat, location_lng 
         FROM user_stamps WHERE user_id = ? ORDER BY collected_at`, [userId], (err, rows) => {
                if (err) {
                    console.error("❌ Get user stamps failed:", err);
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    async getStats() {
        return new Promise((resolve, reject) => {
            Promise.all([
                // 総ユーザー数
                new Promise((res, rej) => {
                    this.db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
                        if (err)
                            rej(err);
                        else
                            res(row.count);
                    });
                }),
                // 完了ユーザー数（2個以上のスタンプを獲得）
                new Promise((res, rej) => {
                    this.db.get(`SELECT COUNT(*) as count FROM (
               SELECT user_id FROM user_stamps GROUP BY user_id HAVING COUNT(*) >= 2
             )`, (err, row) => {
                        if (err)
                            rej(err);
                        else
                            res(row.count);
                    });
                }),
                // スタンプ別獲得数
                new Promise((res, rej) => {
                    this.db.all(`SELECT stamp_id, COUNT(*) as count 
             FROM user_stamps GROUP BY stamp_id ORDER BY stamp_id`, (err, rows) => {
                        if (err)
                            rej(err);
                        else
                            res(rows);
                    });
                }),
            ])
                .then(([totalUsers, completedUsers, stampCounts]) => {
                resolve({
                    totalUsers,
                    completedUsers,
                    completionRate: totalUsers > 0
                        ? ((completedUsers / totalUsers) * 100).toFixed(1)
                        : 0,
                    stampCounts,
                });
            })
                .catch((err) => {
                console.error("❌ Get stats failed:", err);
                reject(err);
            });
        });
    }
    close() {
        this.db.close((err) => {
            if (err) {
                console.error("❌ Database close failed:", err);
            }
            else {
                console.log("✅ Database connection closed");
            }
        });
    }
    // ヘルスチェック用
    async isHealthy() {
        return new Promise((resolve) => {
            this.db.get("SELECT 1", (err) => {
                resolve(!err);
            });
        });
    }
}
exports.default = new Database();
