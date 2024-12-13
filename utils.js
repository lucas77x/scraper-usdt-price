const getYesterdayDate = (timezoneOffset) => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(0, 0, 0, 0);
  date.setMinutes(date.getMinutes() + timezoneOffset * 60);
  return date;
};

const getTodayDate = (timezoneOffset) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setMinutes(date.getMinutes() + timezoneOffset * 60);
  return date;
};

const getCurrentHour = (timezoneOffset) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + timezoneOffset * 60);
  return date.getHours();
};

const formatPrice = (priceText) => {
  // Remove currency symbol and thousand separators, replace comma with dot
  return priceText.replace(/[^\d,]/g, '').replace(',', '.');
};

module.exports = {
  getYesterdayDate,
  getTodayDate,
  getCurrentHour,
  formatPrice
};
