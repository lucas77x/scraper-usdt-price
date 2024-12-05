const sqlite3 = require('sqlite3').verbose();

class Database {
  constructor(dbFilePath = './data.db') {
    this.db = new sqlite3.Database(dbFilePath);
    this.createTables();
  }

  createTables() {
    const pricesTable = `
      CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        price REAL NOT NULL,
        vendor TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const notificationLogTable = `
      CREATE TABLE IF NOT EXISTS notification_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule TEXT NOT NULL,
        notification_time DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    this.db.serialize(() => {
      this.db.run(pricesTable);
      this.db.run(notificationLogTable);
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
    const sql = `SELECT MAX(price) as maxPrice FROM prices WHERE DATE(timestamp) = ?`;
    this.db.get(sql, [date], (err, row) => {
      if (err) {
        return callback(err);
      }
      callback(null, row ? row.maxPrice : null);
    });
  }

  insertPrice(price, vendor) {
    const sql = `INSERT INTO prices (price, vendor) VALUES (?, ?)`;
    this.db.run(sql, [price, vendor]);
  }

  isNotificationSent(rule, callback) {
    const today = new Date().toISOString().split('T')[0];
    const sql = `SELECT COUNT(*) as count FROM notification_log WHERE rule = ? AND DATE(notification_time) = ?`;
    this.db.get(sql, [rule, today], (err, row) => {
      if (err) {
        return callback(err);
      }
      callback(null, row.count > 0);
    });
  }

  logNotification(rule, callback) {
    const sql = `INSERT INTO notification_log (rule) VALUES (?)`;
    this.db.run(sql, [rule], callback);
  }

  isHourlyNotificationSent(callback) {
    const currentHour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    const sql = `SELECT COUNT(*) as count FROM notification_log WHERE rule = 'hourlyNotification' AND strftime('%Y-%m-%dT%H', notification_time) = ?`;
    this.db.get(sql, [currentHour], (err, row) => {
      if (err) {
        return callback(err);
      }
      callback(null, row.count > 0);
    });
  }

  logHourlyNotification(callback) {
    const sql = `INSERT INTO notification_log (rule) VALUES ('hourlyNotification')`;
    this.db.run(sql, callback);
  }
}

module.exports = new Database();
