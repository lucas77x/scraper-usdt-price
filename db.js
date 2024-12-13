const sqlite3 = require('sqlite3').verbose();

class Database {
  constructor(dbFilePath = './data.db') {
    this.db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
      } else {
        console.log('Conectado a la base de datos SQLite.');
      }
    });
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

  getLastPrice() {
    const sql = `SELECT price FROM prices ORDER BY id DESC LIMIT 1`;
    return new Promise((resolve, reject) => {
      this.db.get(sql, [], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row ? row.price : null);
      });
    });
  }

  getPriceForDate(date) {
    const sql = `SELECT MAX(price) as maxPrice FROM prices WHERE DATE(timestamp) = DATE(?)`;
    const formattedDate = date.toISOString().split('T')[0];
    return new Promise((resolve, reject) => {
      this.db.get(sql, [formattedDate], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row && row.maxPrice !== null ? row.maxPrice : null);
      });
    });
  }

  insertPrice(price, vendor) {
    const sql = `INSERT INTO prices (price, vendor) VALUES (?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [price, vendor], function (err) {
        if (err) {
          return reject(err);
        }
        resolve(this.lastID);
      });
    });
  }

  logNotification(rule) {
    const sql = `INSERT INTO notification_log (rule) VALUES (?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [rule], function (err) {
        if (err) {
          return reject(err);
        }
        resolve(this.lastID);
      });
    });
  }
}

const instance = new Database();

module.exports = instance;
