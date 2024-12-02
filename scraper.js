// scraper.js

require('dotenv').config(); // Load environment variables from .env file

const { chromium } = require('playwright');
const db = require('./db');
const { formatPrice } = require('./utils');
const Notifier = require('./notifier');
const RuleEvaluator = require('./rules');

// Telegram configuration from environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

class Scraper {
  constructor(notifier) {
    this.url = 'https://usdc.ar/';
    this.notifier = notifier;
    this.ruleEvaluator = new RuleEvaluator();
  }

  async run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      // Navigate to the target URL
      await page.goto(this.url, { waitUntil: 'networkidle' });

      // Click on the "USDT" button
      await page.click('button:has-text("USDT")');

      // Wait for the "Mejor para vender" section to appear
      await page.waitForSelector('h3:has-text("Mejor para vender")');

      // Retrieve the price and vendor information
      const { priceText, vendorText } = await this.getPriceAndVendor(page);

      // Format the price
      const formattedPrice = parseFloat(formatPrice(priceText));

      // Insert the new price into the database
      db.insertPrice(formattedPrice, vendorText);
      console.log(`Nuevo precio guardado: ${formattedPrice} en ${vendorText}.`);

      // Evaluate notification rules
      const { shouldNotify, reasons } = await this.ruleEvaluator.shouldNotify(formattedPrice);

      if (shouldNotify) {
        let message = `Nuevo precio: ${formattedPrice} en ${vendorText}.\nRazones:\n- ${reasons.join('\n- ')}`;

        // Send notification via Telegram
        try {
          await this.notifier.sendMessage(message);
          console.log('Notificación enviada por Telegram.');

          // Update last notification time
          db.updateLastNotificationTime();
        } catch (error) {
          console.error('Error al enviar la notificación:', error);
        }
      } else {
        console.log('No se envió notificación; no se cumplieron las condiciones.');
      }
    } catch (error) {
      console.error('Error durante el scraping:', error);
    } finally {
      await browser.close();
    }
  }

  async getPriceAndVendor(page) {
    // Select the <h3> element containing "Mejor para vender"
    const mejorParaVenderH3 = await page.$('h3:has-text("Mejor para vender")');

    // Verify that the element exists
    if (!mejorParaVenderH3) {
      throw new Error('No se encontró la sección "Mejor para vender".');
    }

    // Get the closest parent div with the class 'rounded-lg'
    const parentDiv = await mejorParaVenderH3.evaluateHandle(el => el.closest('div.rounded-lg'));

    // Get the price element
    const priceElement = await parentDiv.$('div.text-2xl.font-bold');
    const priceText = await priceElement.innerText();

    // Get the vendor text below the price
    const vendorElement = await parentDiv.$('p.text-xs');
    const vendorText = await vendorElement.innerText();

    return { priceText, vendorText };
  }
}

// Instantiate Notifier
const notifier = new Notifier(BOT_TOKEN, CHAT_ID);

// Pass Notifier to Scraper
const scraper = new Scraper(notifier);
scraper.run();
