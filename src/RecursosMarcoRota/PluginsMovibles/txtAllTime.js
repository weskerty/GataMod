// Este script debe ser modificado para poder funcionar en Windows ya que sh no se reconocera. Ademas, deberas hacer make manualmente a whispercpp con herramientas externas ya que windows no los incluye.
import fs from 'fs';
import { exec } from 'child_process';

let activeDownloads = 0;
const maxDownloads = 1; // Máximo operaciones.(aumentar esto no funcionara ya que el archivo de audio se guarda con un solo nombre, agregue esto para que no se sature el sistema ni se bugee usando el mismo audio.)
const queue = [];

const processQueue = () => {
  if (queue.length === 0 || activeDownloads >= maxDownloads) return;

  const { m, resolve, reject } = queue.shift();
  activeDownloads++;

  handleTranscription(m)
    .then(resolve)
    .catch(reject)
    .finally(() => {
      activeDownloads--;
      processQueue();
    });
};

const handleTranscription = async (m) => {
  if (!m.quoted || !m.quoted.download) return;

  let media = await m.quoted.download();
  const path = `tmp/audio.ogg`;
  await fs.writeFileSync(path, media);
  await m.reply(`⏳ Transcribiendo`);

  // Ejecuta script especificado 
  return new Promise((resolve, reject) => {
    exec(`src/RecursosMarcoRota/ScriptActivo/whispercppAllT.sh`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌Error ejecutando el script: ${error.message}`);
        m.reply(`❌Error ejecutando el script: ${error.message}`);
        reject(error);
        return;
      }

      if (stderr) {
        console.error(`❌Error en el script: ${stderr}`);
        m.reply(`❌Error en el script: ${stderr}`);
        reject(new Error(stderr));
        return;
      }

      m.reply(`🗣️ ${stdout.trim()}`);

      // Elimina el archivo de audio
      fs.unlink(path, (err) => {
        if (err) {
          console.error(`Error eliminando el archivo: ${err.message}`);
        }
        resolve();
      });
    });
  });
};

let handler = (m) => {
  return new Promise((resolve, reject) => {
    queue.push({ m, resolve, reject });
    if (activeDownloads < maxDownloads) {
      processQueue();
    }
  });
};

// Esto lo agrege pensando que puede aparecer en el menu, no estoy seguro si funcione, no lo probe.
handler.help = ['transcripcion'];
handler.tags = ['tools'];
handler.command = /^(txt)$/i;
handler.owner = false; //Si esta funcion esta en .true solo solo los global.owner de /config.js pueden usarlo. 

export default handler;
