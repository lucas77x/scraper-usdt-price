const TelegramBot = require('node-telegram-bot-api');

class Notifier {
  constructor(botToken, chatId) {
    this.bot = new TelegramBot(botToken);
    this.chatId = chatId;
  }

  sendMessage(message) {
    return this.bot.sendMessage(this.chatId, message);
  }
}

module.exports = Notifier;
