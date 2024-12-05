const db = require('./db');
const utils = require('./utils'); 
const dotenv = require('dotenv');

dotenv.config();

class RuleEvaluator {
  constructor() {
    this.notificationTimes = process.env.PRICE_CHANGE_NOTIFICATION_TIMES
      .split(',')
      .map(time => parseInt(time));
    this.timezoneOffset = parseInt(process.env.TIMEZONE_OFFSET) || 0;
    this.notificationStartTime = parseInt(process.env.NOTIFICATION_START_TIME) || 0;
    this.notificationEndTime = parseInt(process.env.NOTIFICATION_END_TIME) || 23;

    this.hourlyNotificationEnabled = process.env.HOURLY_NOTIFICATION_ENABLED === 'true';
  }

  async shouldNotify(currentPrice) {
    const currentHour = utils.getCurrentHour(this.timezoneOffset);

    // Check if the current hour is within the notification time range
    if (currentHour < this.notificationStartTime || currentHour >= this.notificationEndTime) {
      return { shouldNotify: false };
    }

    // Hourly notification
    if (this.hourlyNotificationEnabled) {
      const notificationSent = await this.isNotificationSent('hourlyNotification');

      // Check 
      if (!notificationSent) {
        await this.logNotification('hourlyNotification');
        return { shouldNotify: true, messageType: 'hourly' };
      }
    }

    // Compare the current price with the price of the previous day
    const yesterdayPrice = await this.getYesterdayPrice();
    if (yesterdayPrice !== null && this.notificationTimes.includes(currentHour)) {
      if (currentPrice !== yesterdayPrice) {
        await this.logNotification('dailyComparison');
        return { shouldNotify: true, messageType: 'dailyComparison' };
      }
    }

    // Notify if the price increased since the last check
    const lastPrice = await this.getLastPrice();
    if (lastPrice !== null && currentPrice > lastPrice) {
      await this.logNotification('priceIncrease');
      return { shouldNotify: true, messageType: 'priceIncrease' };
    }

    // Avoid sending unnecessary notifications
    return { shouldNotify: false };
  }

  getYesterdayPrice() {
    return new Promise((resolve, reject) => {
      const yesterday = utils.getYesterdayDate(this.timezoneOffset);
      db.getPriceForDate(yesterday, (err, price) => {
        if (err) reject(err);
        else resolve(price !== null ? parseFloat(price) : null);
      });
    });
  }

  getLastPrice() {
    return new Promise((resolve, reject) => {
      db.getLastPrice((err, price) => {
        if (err) reject(err);
        else resolve(price !== null ? parseFloat(price) : null);
      });
    });
  }

  isNotificationSent(rule) {
    return new Promise((resolve, reject) => {
      db.isNotificationSent(rule, (err, sent) => {
        if (err) reject(err);
        else resolve(sent);
      });
    });
  }

  logNotification(rule) {
    return new Promise((resolve, reject) => {
      db.logNotification(rule, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = RuleEvaluator;
