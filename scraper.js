require('dotenv').config();

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
    console.log('Iniciando el scraper...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      console.log('Navegando a la URL:', this.url);
      await page.goto(this.url, { waitUntil: 'networkidle' });

      console.log('Haciendo clic en el botón USDT');
      await page.click('button:has-text("USDT")');

      console.log('Esperando a que aparezca el selector "Mejor para vender"');
      await page.waitForSelector('h3:has-text("Mejor para vender")');

      console.log('Obteniendo precio y vendedor');
      const { priceText, vendorText } = await this.getPriceAndVendor(page);
      console.log('Precio obtenido:', priceText);
      console.log('Vendedor obtenido:', vendorText);

      const formattedPrice = parseFloat(formatPrice(priceText));
      console.log('Precio formateado:', formattedPrice);

      const { shouldNotify, messageType } = await this.ruleEvaluator.shouldNotify(formattedPrice);
      console.log('Resultado de shouldNotify:', shouldNotify, messageType);

      if (shouldNotify) {
        const message = `Nuevo precio: ${formattedPrice} en ${vendorText}.`;

        try {
          console.log('Enviando notificación');
          await this.notifier.sendMessage(message);
          console.log('Notificación enviada por Telegram.');
        } catch (error) {
          console.error('Error al enviar la notificación:', error);
        }

        // Insertar el nuevo precio en la base de datos
        console.log('Insertando nuevo precio en la base de datos');
        try {
          const lastID = await db.insertPrice(formattedPrice, vendorText);
          console.log(`Nuevo precio guardado con ID ${lastID}: ${formattedPrice} en ${vendorText}.`);
        } catch (error) {
          console.error('Error al guardar el precio en la base de datos:', error);
        }
      } else {
        console.log('No se envió notificación; no se cumplieron las condiciones.');
      }
    } catch (error) {
      console.error('Error durante el scraping:', error);
    } finally {
      await browser.close();
      console.log('Navegador cerrado.');
    }
  }

  async getPriceAndVendor(page) {
    try {
      const priceText = await page.textContent('div:has(h3:has-text("Mejor para vender")) .text-2xl.font-bold');
      const vendorText = await page.textContent('div:has(h3:has-text("Mejor para vender")) p.text-xs');
      return { priceText, vendorText };
    } catch (error) {
      console.error('Error al obtener el precio y el vendedor:', error);
      throw error;
    }
  }
}

(async () => {
  const notifier = new Notifier(process.env.BOT_TOKEN, process.env.CHAT_ID);
  const ruleEvaluator = new RuleEvaluator();
  const scraper = new Scraper(notifier, ruleEvaluator);
  await scraper.run();
})();
