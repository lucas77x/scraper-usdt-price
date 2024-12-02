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

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

function calculatePercentageChange(currentPrice, previousPrice) {
  if (previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

module.exports = { formatPrice, getYesterdayDate, calculatePercentageChange };
