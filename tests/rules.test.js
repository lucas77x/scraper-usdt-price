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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should notify hourly if conditions are met', async () => {
    utils.getCurrentHour.mockReturnValue(10);

    db.isNotificationSent.mockImplementation((rule, callback) => {
      if (rule === 'hourlyNotification') {
        callback(null, false);
      } else {
        callback(null, false);
      }
    });

    db.logNotification.mockImplementation((rule, callback) => {
      callback(null);
    });

    const result = await ruleEvaluator.shouldNotify(100);

    expect(result.shouldNotify).toBe(true);
    expect(result.messageType).toBe('hourly');
    expect(db.isNotificationSent).toHaveBeenCalledWith('hourlyNotification', expect.any(Function));
    expect(db.logNotification).toHaveBeenCalledWith('hourlyNotification', expect.any(Function));
  });

  test('should not notify if outside notification window', async () => {
    utils.getCurrentHour.mockReturnValue(23);

    const result = await ruleEvaluator.shouldNotify(100);

    expect(result.shouldNotify).toBe(false);
    expect(db.isNotificationSent).not.toHaveBeenCalled();
    expect(db.logNotification).not.toHaveBeenCalled();
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
    expect(db.isNotificationSent).toHaveBeenCalledWith('dailyComparison', expect.any(Function));
    expect(db.logNotification).toHaveBeenCalledWith('dailyComparison', expect.any(Function));
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
    expect(db.isNotificationSent).toHaveBeenCalledWith('dailyComparison', expect.any(Function));
    expect(db.logNotification).not.toHaveBeenCalledWith('dailyComparison', expect.any(Function));
  });

  test('should notify price increase when currentPrice > lastPrice', async () => {
    utils.getCurrentHour.mockReturnValue(14);
    utils.getYesterdayDate.mockReturnValue('2023-09-21');

    db.isNotificationSent.mockImplementation((rule, callback) => {
      if (rule === 'hourlyNotification') {
        callback(null, true);
      } else {
        callback(null, false);
      }
    });

    db.getPriceForDate.mockImplementation((date, callback) => {
      callback(null, 100);
    });

    db.getLastPrice.mockImplementation((callback) => {
      callback(null, 95);
    });

    db.logNotification.mockImplementation((rule, callback) => {
      if (rule === 'priceIncrease') {
        callback(null);
      } else {
        callback(null);
      }
    });

    const result = await ruleEvaluator.shouldNotify(100);

    expect(result.shouldNotify).toBe(true);
    expect(result.messageType).toBe('priceIncrease');
    expect(db.logNotification).toHaveBeenCalledWith('priceIncrease', expect.any(Function));
  });

  test('should not notify price increase when currentPrice <= lastPrice', async () => {
    utils.getCurrentHour.mockReturnValue(14);
    utils.getYesterdayDate.mockReturnValue('2023-09-21');

    db.isNotificationSent.mockImplementation((rule, callback) => {
      if (rule === 'hourlyNotification') {
        callback(null, true);
      } else {
        callback(null, false);
      }
    });

    db.getPriceForDate.mockImplementation((date, callback) => {
      callback(null, 100);
    });

    db.getLastPrice.mockImplementation((callback) => {
      callback(null, 100);
    });

    const result = await ruleEvaluator.shouldNotify(100); 

    expect(result.shouldNotify).toBe(false);
    expect(db.logNotification).not.toHaveBeenCalledWith('priceIncrease', expect.any(Function));
  });
});
