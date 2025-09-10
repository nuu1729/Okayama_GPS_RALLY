// scripts/init-database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// データディレクトリが存在しない場合は作成
const dataDir = path.join(__dirname, '../backend/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data directory:', dataDir);
}

// データベースファイルのパス
const dbPath = path.join(dataDir, 'stamps.db');

console.log('🗄️ Initializing database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

db.serialize(() => {
  // ユーザーテーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      device_info TEXT,
      language TEXT DEFAULT 'ja'
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating users table:', err);
    } else {
      console.log('✅ Users table ready');
    }
  });

  // ユーザースタンプテーブル
  db.run(`
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
      console.error('❌ Error creating user_stamps table:', err);
    } else {
      console.log('✅ User_stamps table ready');
    }
  });

  // インデックス作成
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_stamps_user_id ON user_stamps(user_id)`, (err) => {
    if (err) {
      console.error('❌ Error creating user_id index:', err);
    } else {
      console.log('✅ User_id index ready');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_user_stamps_stamp_id ON user_stamps(stamp_id)`, (err) => {
    if (err) {
      console.error('❌ Error creating stamp_id index:', err);
    } else {
      console.log('✅ Stamp_id index ready');
    }
  });

  // テストデータの挿入（開発用）
  db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
    if (err) {
      console.error('❌ Error checking users:', err);
    } else if (row.count === 0) {
      console.log('ℹ️ No users found, database is ready for first use');
    } else {
      console.log(`ℹ️ Found ${row.count} existing users`);
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('❌ Error closing database:', err);
  } else {
    console.log('✅ Database initialization completed');
    console.log('🚀 You can now run: npm run dev');
  }
});
