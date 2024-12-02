const { mock } = require('jest-mock-extended');
const TelegramBot = require('node-telegram-bot-api');
const Notifier = require('../notifier');

jest.mock('node-telegram-bot-api');

describe('Notifier', () => {
  let notifier;
  let mockTelegramBot;

  beforeEach(() => {
    mockTelegramBot = mock(TelegramBot);

    TelegramBot.mockImplementation(() => mockTelegramBot);

    notifier = new Notifier('fake-bot-token', 'fake-chat-id');
  });

  test('should send message via Telegram', async () => {
    mockTelegramBot.sendMessage.mockResolvedValue({ message_id: 1 });

    await notifier.sendMessage('Test message');

    expect(mockTelegramBot.sendMessage).toHaveBeenCalledWith('fake-chat-id', 'Test message');
  });

  test('should handle error when sending message', async () => {
    const error = new Error('Network error');
    mockTelegramBot.sendMessage.mockRejectedValue(error);

    await expect(notifier.sendMessage('Test message')).rejects.toThrow('Network error');
  });
});
