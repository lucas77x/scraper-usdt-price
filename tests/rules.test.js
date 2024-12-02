const RuleEvaluator = require('../rules');
const db = require('../db');
const utils = require('../utils');

jest.mock('../db');
jest.mock('../utils');

describe('RuleEvaluator', () => {
  let ruleEvaluator;

  beforeEach(() => {
    process.env.PRICE_CHANGE_NOTIFICATION_TIMES = '12,15,19';
    process.env.TIMEZONE_OFFSET = '-3';
    process.env.NOTIFICATION_START_TIME = '8';
    process.env.NOTIFICATION_END_TIME = '22';
    process.env.HOURLY_NOTIFICATION_ENABLED = 'true';

    jest.resetAllMocks();

    ruleEvaluator = new RuleEvaluator();
  });

  test('should notify hourly if conditions are met', async () => {
    utils.getCurrentHour.mockReturnValue(10);

    db.isNotificationSent.mockImplementation((rule, callback) => {
      callback(null, false);
    });

    db.logNotification.mockImplementation((rule, callback) => {
      callback(null);
    });

    const result = await ruleEvaluator.shouldNotify(100);

    expect(result.shouldNotify).toBe(true);
    expect(result.messageType).toBe('hourly');
  });

  test('should not notify if outside notification window', async () => {
    utils.getCurrentHour.mockReturnValue(23);

    const result = await ruleEvaluator.shouldNotify(100);

    expect(result.shouldNotify).toBe(false);
  });

  test('should notify daily comparison if price changed', async () => {
    utils.getCurrentHour.mockReturnValue(12);
    utils.getYesterdayDate.mockReturnValue('2023-09-21');

    db.isNotificationSent.mockImplementation((rule, callback) => {
      if (rule === 'hourlyNotification') {
        callback(null, true);
      } else if (rule === 'dailyComparison') {
        callback(null, false);
      } else {
        callback(null, false);
      }
    });

    db.logNotification.mockImplementation((rule, callback) => {
      callback(null);
    });

    db.getPriceForDate.mockImplementation((date, callback) => {
      callback(null, 90);
    });

    const result = await ruleEvaluator.shouldNotify(100);

    expect(result.shouldNotify).toBe(true);
    expect(result.messageType).toBe('dailyComparison');
  });

  test('should not notify daily comparison if price did not change', async () => {
    utils.getCurrentHour.mockReturnValue(12);
    utils.getYesterdayDate.mockReturnValue('2023-09-21');

    db.isNotificationSent.mockImplementation((rule, callback) => {
      if (rule === 'hourlyNotification') {
        callback(null, true);
      } else if (rule === 'dailyComparison') {
        callback(null, false);
      } else {
        callback(null, false);
      }
    });

    db.getPriceForDate.mockImplementation((date, callback) => {
      callback(null, 100); 
    });

    const result = await ruleEvaluator.shouldNotify(100);

    expect(result.shouldNotify).toBe(false);
  });
});
