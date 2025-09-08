// backend/src/database.ts
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

class Database {
  private db: sqlite3.Database;

  constructor() {
    // データディレクトリの確認・作成
    const dataDir = path.join(__dirname, "../data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log("✅ Created data directory:", dataDir);
    }

    const dbPath = path.join(dataDir, "stamps.db");
    console.log("🗄️ Database path:", dbPath);

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("❌ Database connection failed:", err);
        throw err;
      } else {
        console.log("✅ Connected to SQLite database");
      }
    });

    this.init();
  }

  private init(): void {
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
        } else {
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
        } else {
          console.log("✅ User_stamps table ready");
        }
      });

      // インデックス作成
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_user_stamps_user_id ON user_stamps(user_id)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_user_stamps_stamp_id ON user_stamps(stamp_id)`);
      
      console.log("✅ Database initialization completed");
    });
  }

  async createUser(deviceInfo: string, language: string = "ja"): Promise<string> {
    return new Promise((resolve, reject) => {
      const userId = uuidv4();
      this.db.run(
        `INSERT INTO users (id, device_info, language) VALUES (?, ?, ?)`,
        [userId, deviceInfo, language],
        function(err: Error | null) {
          if (err) {
            console.error("❌ Create user failed:", err);
            reject(err);
          } else {
            console.log(`✅ User created: ${userId.substring(0, 8)}...`);
            resolve(userId);
          }
        }
      );
    });
  }

  async updateUserActivity(userId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?`,
        [userId],
        function(err: Error | null) {
          if (err) {
            console.error("❌ Update user activity failed:", err);
            reject(err);
          } else {
            resolve(this.changes ?? 0);
          }
        }
      );
    });
  }

  async collectStamp(
    userId: string,
    stampId: number,
    location: { lat: number; lng: number }
  ): Promise<{ alreadyCollected: boolean; id: number }> {
    return new Promise((resolve, reject) => {
      // まず既存の記録をチェック
      this.db.get(
        `SELECT id FROM user_stamps WHERE user_id = ? AND stamp_id = ?`,
        [userId, stampId],
        (err: Error | null, row: { id: number } | undefined) => {
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
          this.db.run(
            `INSERT INTO user_stamps (user_id, stamp_id, location_lat, location_lng) 
             VALUES (?, ?, ?, ?)`,
            [userId, stampId, location.lat, location.lng],
            function(err: Error | null) {
              if (err) {
                console.error("❌ Collect stamp failed:", err);
                reject(err);
              } else {
                console.log(`✅ Stamp ${stampId} collected by user ${userId.substring(0, 8)}...`);
                resolve({ alreadyCollected: false, id: this.lastID! });
              }
            }
          );
        }
      );
    });
  }

  async getUserStamps(
    userId: string
  ): Promise<{ stamp_id: number; collected_at: string; location_lat: number; location_lng: number }[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT stamp_id, collected_at, location_lat, location_lng 
         FROM user_stamps WHERE user_id = ? ORDER BY collected_at`,
        [userId],
        (err: Error | null, rows: unknown[]) => {
          if (err) {
            console.error("❌ Get user stamps failed:", err);
            reject(err);
          } else {
            resolve(
              rows as {
                stamp_id: number;
                collected_at: string;
                location_lat: number;
                location_lng: number;
              }[]
            );
          }
        }
      );
    });
  }

  async getStats(): Promise<{
    totalUsers: number;
    completedUsers: number;
    completionRate: string | number;
    stampCounts: { stamp_id: number; count: number }[];
  }> {
    return new Promise((resolve, reject) => {
      Promise.all([
        // 総ユーザー数
        new Promise<number>((res, rej) => {
          this.db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
            if (err) rej(err);
            else res((row as any).count as number);
          });
        }),
        // 完了ユーザー数（2個以上のスタンプを獲得）
        new Promise<number>((res, rej) => {
          this.db.get(
            `SELECT COUNT(*) as count FROM (
               SELECT user_id FROM user_stamps GROUP BY user_id HAVING COUNT(*) >= 2
             )`,
            (err, row) => {
              if (err) rej(err);
              else res((row as any).count as number);
            }
          );
        }),
        // スタンプ別獲得数
        new Promise<{ stamp_id: number; count: number }[]>((res, rej) => {
          this.db.all(
            `SELECT stamp_id, COUNT(*) as count 
             FROM user_stamps GROUP BY stamp_id ORDER BY stamp_id`,
            (err, rows) => {
              if (err) rej(err);
              else res(rows as { stamp_id: number; count: number }[]);
            }
          );
        }),
      ])
        .then(([totalUsers, completedUsers, stampCounts]) => {
          resolve({
            totalUsers,
            completedUsers,
            completionRate:
              totalUsers > 0
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

  close(): void {
    this.db.close((err) => {
      if (err) {
        console.error("❌ Database close failed:", err);
      } else {
        console.log("✅ Database connection closed");
      }
    });
  }

  // ヘルスチェック用
  async isHealthy(): Promise<boolean> {
    return new Promise((resolve) => {
      this.db.get("SELECT 1", (err) => {
        resolve(!err);
      });
    });
  }
}

export default new Database();
