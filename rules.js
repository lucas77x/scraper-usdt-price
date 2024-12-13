const db = require('./db');
const utils = require('./utils'); 
const dotenv = require('dotenv');

dotenv.config();

class RuleEvaluator {
  constructor() {
    this.timezoneOffset = parseInt(process.env.TIMEZONE_OFFSET) || 0;
    this.notificationStartTime = parseInt(process.env.NOTIFICATION_START_TIME) || 0;
    this.notificationEndTime = parseInt(process.env.NOTIFICATION_END_TIME) || 23;
  }

  async shouldNotify(currentPrice) {
    const currentHour = utils.getCurrentHour(this.timezoneOffset);

    if (currentHour < this.notificationStartTime || currentHour >= this.notificationEndTime) {
      return { shouldNotify: false };
    }

    try {
      const lastPriceOfDay = await this.getLastPriceOfDay();

      if (lastPriceOfDay === null || currentPrice > lastPriceOfDay) {
        await this.logNotification('priceIncrease');
        return { shouldNotify: true, messageType: 'priceIncrease' };
      }

      return { shouldNotify: false };
    } catch (error) {
      console.error('Error al evaluar las reglas:', error);
      return { shouldNotify: false };
    }
  }

  async getLastPriceOfDay() {
    const today = utils.getTodayDate(this.timezoneOffset);
    try {
      const price = await db.getPriceForDate(today);
      return price !== null ? parseFloat(price) : null;
    } catch (error) {
      console.error('Error al obtener el último precio del día:', error);
      return null;
    }
  }

  async logNotification(rule) {
    try {
      await db.logNotification(rule);
    } catch (error) {
      console.error('Error al registrar la notificación:', error);
    }
  }
}

module.exports = RuleEvaluator;
