const sqlite3 = require('sqlite3').verbose();

class Database {
  constructor(dbFilePath = './data.db') {
    this.db = new sqlite3.Database(dbFilePath);
    this.createTables();
  }

  createTables() {
    // Create 'prices' table if it doesn't exist
    const pricesTable = `
      CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        price REAL NOT NULL,
        vendor TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create 'notification_info' table if it doesn't exist
    const notificationInfoTable = `
      CREATE TABLE IF NOT EXISTS notification_info (
        id INTEGER PRIMARY KEY,
        last_notification DATETIME
      );
      INSERT OR IGNORE INTO notification_info (id, last_notification) VALUES (1, NULL);
    `;

    this.db.serialize(() => {
      this.db.run(pricesTable);
      this.db.run(notificationInfoTable);
    });
  }

  getLastPrice(callback) {
    const sql = `SELECT price FROM prices ORDER BY id DESC LIMIT 1`;
    this.db.get(sql, [], (err, row) => {
      if (err) {
        return callback(err);
      }
      callback(null, row ? row.price : null);
    });
  }

  getPriceForDate(date, callback) {
    const sql = `SELECT price FROM prices WHERE DATE(timestamp) = ? ORDER BY timestamp DESC LIMIT 1`;
    this.db.get(sql, [date], (err, row) => {
      if (err) {
        return callback(err);
      }
      callback(null, row ? row.price : null);
    });
  }

  insertPrice(price, vendor) {
    const sql = `INSERT INTO prices (price, vendor) VALUES (?, ?)`;
    this.db.run(sql, [price, vendor]);
  }

  updateLastNotificationTime() {
    const sql = `UPDATE notification_info SET last_notification = CURRENT_TIMESTAMP WHERE id = 1`;
    this.db.run(sql);
  }

  getLastNotificationTime(callback) {
    const sql = `SELECT last_notification FROM notification_info WHERE id = 1`;
    this.db.get(sql, [], (err, row) => {
      if (err) return callback(err);
      callback(null, row ? row.last_notification : null);
    });
  }
}

module.exports = new Database();
