import sqlite3 from "sqlite3";
import path from "path";
import { v4 as uuidv4 } from "uuid";

class Database {
  private db: sqlite3.Database; // 👈 フィールドをここで宣言

  constructor() {
    const dbPath = path.join(__dirname, "../data/stamps.db");
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  private init(): void {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
          device_info TEXT,
          language TEXT DEFAULT 'ja'
        )
      `);

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
      `);

      this.db.run(
        `CREATE INDEX IF NOT EXISTS idx_user_stamps_user_id ON user_stamps(user_id)`
      );
      this.db.run(
        `CREATE INDEX IF NOT EXISTS idx_user_stamps_stamp_id ON user_stamps(stamp_id)`
      );
    });
  }

  async createUser(deviceInfo: string, language: string = "ja"): Promise<string> {
    return new Promise((resolve, reject) => {
      const userId = uuidv4();
      this.db.run(
        `INSERT INTO users (id, device_info, language) VALUES (?, ?, ?)`,
        [userId, deviceInfo, language],
        (err: Error | null) => {
          if (err) reject(err);
          else resolve(userId);
        }
      );
    });
  }

  async updateUserActivity(userId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?`,
        [userId],
        function (this: sqlite3.RunResult, err: Error | null) {
          if (err) reject(err);
          else resolve(this.changes ?? 0);
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
      this.db.get(
        `SELECT id FROM user_stamps WHERE user_id = ? AND stamp_id = ?`,
        [userId, stampId],
        (err: Error | null, row: { id: number } | undefined) => {
          if (err) {
            reject(err);
            return;
          }

          if (row) {
            resolve({ alreadyCollected: true, id: row.id });
            return;
          }

          this.db.run(
            `INSERT INTO user_stamps (user_id, stamp_id, location_lat, location_lng) 
             VALUES (?, ?, ?, ?)`,
            [userId, stampId, location.lat, location.lng],
            function (this: sqlite3.RunResult, err: Error | null) {
              if (err) reject(err);
              else resolve({ alreadyCollected: false, id: this.lastID });
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
          if (err) reject(err);
          else
            resolve(
              rows as {
                stamp_id: number;
                collected_at: string;
                location_lat: number;
                location_lng: number;
              }[]
            );
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
        new Promise<number>((res, rej) => {
          this.db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
            if (err) rej(err);
            else res((row as any).count as number);
          });
        }),
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
        .catch(reject);
    });
  }

  close(): void {
    this.db.close();
  }
}

export default new Database();
