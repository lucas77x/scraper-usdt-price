// scraper.js

require('dotenv').config(); // Load environment variables from .env file

const { chromium } = require('playwright');
const db = require('./db');
const { formatPrice } = require('./utils');
const Notifier = require('./notifier');
const RuleEvaluator = require('./rules');

class Scraper {
  constructor(notifier, ruleEvaluator) {
    this.url = 'https://usdc.ar/';
    this.notifier = notifier;
    this.ruleEvaluator = ruleEvaluator;
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

      // Evaluate notification rules
      const { shouldNotify, reasons, messageType } = await this.ruleEvaluator.shouldNotify(formattedPrice);

      if (shouldNotify) {
        let message;

        if (messageType === 'hourly') {
          // Message for hourly notification
          message = `Precio de compra: $${formattedPrice} en ${vendorText}.`;
        } else {
          // Default message for other notifications
          message = `Nuevo precio: ${formattedPrice} en ${vendorText}.\nRazones:\n- ${reasons.join('\n- ')}`;
        }

        // Send notification via Telegram
        try {
          await this.notifier.sendMessage(message);
          console.log('Notificación enviada por Telegram.');
        } catch (error) {
          console.error('Error al enviar la notificación:', error);
        }
      } else {
        console.log('No se envió notificación; no se cumplieron las condiciones.');
      }

      // Insert the new price into the database only if it has changed
      const lastPrice = await this.getLastPrice();

      if (formattedPrice !== lastPrice) {
        db.insertPrice(formattedPrice, vendorText);
        console.log(`Nuevo precio guardado: ${formattedPrice} en ${vendorText}.`);
      } else {
        console.log('El precio no cambió. No se guardó en la base de datos.');
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

  getLastPrice() {
    return new Promise((resolve, reject) => {
      db.getLastPrice((err, price) => {
        if (err) reject(err);
        else resolve(price !== null ? parseFloat(price) : null);
      });
    });
  }
}

// Instantiate Notifier and RuleEvaluator
const notifier = new Notifier(process.env.BOT_TOKEN, process.env.CHAT_ID);
const ruleEvaluator = new RuleEvaluator();

// Instantiate and run Scraper
const scraper = new Scraper(notifier, ruleEvaluator);
scraper.run();
