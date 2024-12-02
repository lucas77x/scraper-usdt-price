// rules.js

const config = require('./config');
const db = require('./db');
const { calculatePercentageChange, getYesterdayDate } = require('./utils');

class RuleEvaluator {
  constructor() {
    this.notificationRules = config.notificationRules;
  }

  async shouldNotify(currentPrice) {
    const reasons = [];

    // Check if price increased since yesterday
    if (this.notificationRules.priceIncreasedSinceYesterday) {
      const yesterdayPrice = await this.getYesterdayPrice();
      if (yesterdayPrice !== null && currentPrice > yesterdayPrice) {
        reasons.push('El precio aumentó respecto a ayer.');
      }
    }

    // Check thresholds
    if (this.notificationRules.thresholds) {
      const { upperLimit, lowerLimit } = this.notificationRules.thresholds;
      if (upperLimit && currentPrice > upperLimit) {
        reasons.push(`El precio superó el límite superior de ${upperLimit}.`);
      }
      if (lowerLimit && currentPrice < lowerLimit) {
        reasons.push(`El precio cayó por debajo del límite inferior de ${lowerLimit}.`);
      }
    }

    // Check percentage change
    if (this.notificationRules.percentageChange.enabled) {
      const lastPrice = await this.getLastPrice();
      if (lastPrice !== null) {
        const percentageChange = calculatePercentageChange(currentPrice, lastPrice);
        if (Math.abs(percentageChange) >= this.notificationRules.percentageChange.changeThreshold) {
          reasons.push(`El precio cambió en ${percentageChange.toFixed(2)}% desde el último valor.`);
        }
      }
    }

    // Cooldown logic
    if (this.notificationRules.notificationCooldown) {
      const lastNotificationTime = await this.getLastNotificationTime();
      if (lastNotificationTime) {
        const now = new Date();
        const lastNotificationDate = new Date(lastNotificationTime);
        const minutesSinceLastNotification = (now - lastNotificationDate) / 1000 / 60;

        if (minutesSinceLastNotification < this.notificationRules.notificationCooldown) {
          return { shouldNotify: false };
        }
      }
    }

    if (reasons.length > 0) {
      return { shouldNotify: true, reasons };
    } else {
      return { shouldNotify: false };
    }
  }

  getYesterdayPrice() {
    return new Promise((resolve, reject) => {
      const yesterday = getYesterdayDate();
      db.getPriceForDate(yesterday, (err, price) => {
        if (err) reject(err);
        else resolve(price);
      });
    });
  }

  getLastPrice() {
    return new Promise((resolve, reject) => {
      db.getLastPrice((err, price) => {
        if (err) reject(err);
        else resolve(price);
      });
    });
  }

  getLastNotificationTime() {
    return new Promise((resolve, reject) => {
      db.getLastNotificationTime((err, time) => {
        if (err) reject(err);
        else resolve(time);
      });
    });
  }
}

module.exports = RuleEvaluator;
