const { getYesterdayDate, getCurrentHour, formatPrice } = require('../utils');

describe('Utils', () => {
  test('getYesterdayDate should return correct date', () => {
    const timezoneOffset = -3;
    const yesterday = getYesterdayDate(timezoneOffset);
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - 1);
    expectedDate.setHours(0, 0, 0, 0);
    expectedDate.setMinutes(expectedDate.getMinutes() + timezoneOffset * 60);

    expect(yesterday.toISOString()).toBe(expectedDate.toISOString());
  });

  test('getCurrentHour should return correct hour', () => {
    const timezoneOffset = -3;
    const currentHour = getCurrentHour(timezoneOffset);
    const expectedHour = new Date();
    expectedHour.setMinutes(expectedHour.getMinutes() + timezoneOffset * 60);

    expect(currentHour).toBe(expectedHour.getHours());
  });

  test('formatPrice should format price correctly', () => {
    const priceText = '1.234,56';
    const formattedPrice = formatPrice(priceText);

    expect(formattedPrice).toBe('1234.56');
  });
});