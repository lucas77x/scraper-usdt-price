module.exports = {
  notificationRules: {
    priceIncreasedSinceYesterday: true, // Notify if the price increased since yesterday
    thresholds: {
      upperLimit: 1200,  // Upper limit for notification
      lowerLimit: 1000,  // Lower limit for notification
    },
    percentageChange: {
      enabled: true,
      changeThreshold: 2.0,  // Notify if the price changes more than 2%
    },
    notificationCooldown: 30,  // Cooldown in minutes between notifications
  },
};
