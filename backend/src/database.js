const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, '../data/stamps.db');
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // users テーブル
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
          device_info TEXT,
          language TEXT DEFAULT 'ja'
        )
      `);

      // user_stamps テーブル
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

      // インデックス作成
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_user_stamps_user_id ON user_stamps(user_id)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_user_stamps_stamp_id ON user_stamps(stamp_id)`);
    });
  }

  // ユーザー作成
  async createUser(deviceInfo, language = 'ja') {
    return new Promise((resolve, reject) => {
      const userId = uuidv4();
      this.db.run(
        `INSERT INTO users (id, device_info, language) VALUES (?, ?, ?)`,
        [userId, deviceInfo, language],
        function(err) {
          if (err) reject(err);
          else resolve(userId);
        }
      );
    });
  }

  // ユーザー情報更新
  async updateUserActivity(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?`,
        [userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  // スタンプ獲得記録
  async collectStamp(userId, stampId, location) {
    return new Promise((resolve, reject) => {
      // 既に獲得済みかチェック
      this.db.get(
        `SELECT id FROM user_stamps WHERE user_id = ? AND stamp_id = ?`,
        [userId, stampId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row) {
            resolve({ alreadyCollected: true, id: row.id });
            return;
          }

          // 新規記録
          this.db.run(
            `INSERT INTO user_stamps (user_id, stamp_id, location_lat, location_lng) 
             VALUES (?, ?, ?, ?)`,
            [userId, stampId, location.lat, location.lng],
            function(err) {
              if (err) reject(err);
              else resolve({ alreadyCollected: false, id: this.lastID });
            }
          );
        }
      );
    });
  }

  // ユーザーの獲得済みスタンプ取得
  async getUserStamps(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT stamp_id, collected_at, location_lat, location_lng 
         FROM user_stamps WHERE user_id = ? ORDER BY collected_at`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // 統計情報取得
  async getStats() {
    return new Promise((resolve, reject) => {
      const stats = {};
      
      // 並列で複数の統計を取得
      Promise.all([
        // 総ユーザー数
        new Promise((res, rej) => {
          this.db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
            if (err) rej(err);
            else res(row.count);
          });
        }),
        
        // 完了者数（全スタンプ獲得）
        new Promise((res, rej) => {
          this.db.get(`
            SELECT COUNT(*) as count FROM (
              SELECT user_id FROM user_stamps GROUP BY user_id HAVING COUNT(*) >= 2
            )`, (err, row) => {
            if (err) rej(err);
            else res(row.count);
          });
        }),

        // スタンプ別獲得数
        new Promise((res, rej) => {
          this.db.all(`
            SELECT stamp_id, COUNT(*) as count 
            FROM user_stamps GROUP BY stamp_id ORDER BY stamp_id`, 
            (err, rows) => {
              if (err) rej(err);
              else res(rows);
            }
          );
        })
      ]).then(([totalUsers, completedUsers, stampCounts]) => {
        resolve({
          totalUsers,
          completedUsers,
          completionRate: totalUsers > 0 ? (completedUsers / totalUsers * 100).toFixed(1) : 0,
          stampCounts
        });
      }).catch(reject);
    });
  }

  // データベース接続終了
  close() {
    this.db.close();
  }
}

module.exports = new Database();