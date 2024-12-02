const db = require('./db');
const { getYesterdayDate, getCurrentHour } = require('./utils');
const dotenv = require('dotenv');

dotenv.config();

class RuleEvaluator {
  constructor() {
    // Load configurations from .env
    this.notificationTimes = process.env.PRICE_CHANGE_NOTIFICATION_TIMES.split(',').map(time => parseInt(time));
    this.timezoneOffset = parseInt(process.env.TIMEZONE_OFFSET) || 0;
    this.notificationStartTime = parseInt(process.env.NOTIFICATION_START_TIME) || 0;
    this.notificationEndTime = parseInt(process.env.NOTIFICATION_END_TIME) || 23;

    // Hourly notification
    this.hourlyNotificationEnabled = process.env.HOURLY_NOTIFICATION_ENABLED === 'true';
  }

  async shouldNotify(currentPrice) {
    const currentHour = getCurrentHour(this.timezoneOffset);

    // Check if current time is within the notification window
    if (currentHour < this.notificationStartTime || currentHour >= this.notificationEndTime) {
      return { shouldNotify: false };
    }

    // Hourly Notification Rule
    if (this.hourlyNotificationEnabled) {
      const notificationSent = await this.isNotificationSent('hourlyNotification');

      // Check if a notification has already been sent this hour
      if (!notificationSent) {
        await this.logNotification('hourlyNotification');
        return { shouldNotify: true, reasons: [], messageType: 'hourly' };
      }
    }

    // Notification 3 times a day comparing with yesterday's price
    const yesterdayPrice = await this.getYesterdayPrice();
    if (yesterdayPrice !== null && this.notificationTimes.includes(currentHour)) {
      if (currentPrice !== yesterdayPrice) {
        await this.logNotification('dailyComparison');
        return { shouldNotify: true, reasons: ['priceChange'], messageType: 'dailyComparison' };
      }
    }

    // If no conditions met, do not send notification
    return { shouldNotify: false };
  }

  getYesterdayPrice() {
    return new Promise((resolve, reject) => {
      const yesterday = getYesterdayDate(this.timezoneOffset);
      db.getPriceForDate(yesterday, (err, price) => {
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
