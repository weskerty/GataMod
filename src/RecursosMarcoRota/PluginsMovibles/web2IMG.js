import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const savePath = path.join('./tmp');  // Descarga Temporal.
const MIN_IMAGE_SIZE = 5 * 1024; // Tamaño mínimo para enviar la imagen.

const downloadQueue = [];
let isProcessing = false;
let browserInstance;

async function initializeBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        "--disable-features=BlockInsecurePrivateNetworkRequests",
        "--disable-features=IsolateOrigins", 
        "--disable-site-isolation-trials", 
        '--disable-web-security', 
        '--headless',
        '--hide-scrollbars',
        '--mute-audio',
        '--disable-logging',
        '--disable-infobars',
        '--disable-breakpad',
        '--disable-gl-drawing-for-tests',
        '--disable-canvas-aa', 
        '--disable-2d-canvas-clip-aa',
        '--user-data-dir=/$HOME/.config/chromium/', //ubicación de los datos. útil para que utilice tus credenciales y asi poder descargar las imagenes de ciertas paginas que requieren login.
        '--no-sandbox'
      ],
      executablePath: '/usr/bin/chromium' //ubicación del navegador, puede ser cualquier chromium o firefox. Leer Documentacion Puppeteer.
    });
  }
  return browserInstance;
}

async function downloadImages(url, conn, chatId) {
  let browser;
  try {
    browser = await initializeBrowser();
    const page = await browser.newPage();
    await page.goto(url, { timeout: 90000, waitUntil: 'networkidle2' });

    const imageLinks = await page.$$eval('img[src]', imgs => imgs.map(img => img.src));

    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }

    for (const [index, link] of imageLinks.entries()) {
      try {
        const viewSource = await page.goto(link);
        const buffer = await viewSource.buffer();

        if (buffer.length < MIN_IMAGE_SIZE) {
          console.log(`Imagen omitida por tamaño`);
          continue;
        }

        const filePath = path.join(savePath, `image_${index}.jpg`);
        fs.writeFileSync(filePath, buffer);
        await conn.sendMessage(chatId, { image: { url: filePath } });
        fs.unlinkSync(filePath);
      } catch (innerError) {
        console.error(`Error al descargar la imagen ${link}:`, innerError);
      }
    }

    await page.close();
  } catch (error) {
    console.error('Error al descargar las imágenes:', error);
    await conn.sendMessage(chatId, { text: `❌ Error: ${error.message}` });
  }
}

async function processQueue(conn) {
  if (isProcessing || downloadQueue.length === 0) return;

  isProcessing = true;
  const { url, chatId } = downloadQueue.shift();
  await downloadImages(url, conn, chatId);
  isProcessing = false;

  if (downloadQueue.length === 0) {
    if (browserInstance) {
      await browserInstance.close();
      browserInstance = null;
    }
  } else {
    processQueue(conn);
  }
}

const handler = async (m, { conn, text }) => {
  const quotedMessage = m.quoted && m.quoted.text ? m.quoted.text : '';
  const urlMatch = quotedMessage.match(/\bhttps?:\/\/\S+/gi);
  const url = urlMatch ? urlMatch[0] : (text ? text.trim() : '');

  if (!url.startsWith('http')) {
    await conn.sendMessage(m.chat, { text: '💢 Debe ser un Link' });
    return;
  }

  if (downloadQueue.length > 0 || isProcessing) {
    await conn.sendMessage(m.chat, { text: '⏳ Espera un Momento...' });
  } else {
    await conn.sendMessage(m.chat, { text: '💾 Descargando imágenes...' });
  }

  downloadQueue.push({ url, chatId: m.chat });
  processQueue(conn);
};

handler.help = ['Web2IMGs'];
handler.tags = ['tools'];
handler.command = /^(web2)$/i;
handler.owner = false;

export default handler;
