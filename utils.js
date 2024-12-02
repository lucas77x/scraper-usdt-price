// utils.js

function formatPrice(priceStr) {
  // Remove thousand separators and replace comma with decimal point
  let normalized = priceStr.replace(/\./g, '').replace(',', '.').replace('$', '').trim();
  let price = parseFloat(normalized);

  // Check if the decimals are .00
  if (price % 1 === 0) {
    return price.toFixed(0);
  } else {
    return price.toFixed(2);
  }
}

function getYesterdayDate(timezoneOffset) {
  const now = new Date();
  // Adjust for timezone
  now.setHours(now.getHours() + timezoneOffset);
  now.setDate(now.getDate() - 1);
  return now.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

function calculatePercentageChange(currentPrice, previousPrice) {
  if (previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

function getCurrentHour(timezoneOffset) {
  const now = new Date();
  now.setHours(now.getHours() + timezoneOffset);
  return now.getHours();
}

module.exports = { formatPrice, getYesterdayDate, calculatePercentageChange, getCurrentHour };
