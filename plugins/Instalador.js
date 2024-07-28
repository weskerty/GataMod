import fs from 'fs';
import { exec } from 'child_process';

// Directorio de los scripts
const scriptsDirectory = 'src/RecursosMarcoRota/Instaladores';

// Lista de scripts
const handleListScripts = async (m) => {
  try {
    // Lee los archivos del directorio
    const files = fs.readdirSync(scriptsDirectory);

    // Pone nombres de archivo en una lista numerada
    const fileList = files.map((file, index) => `${index + 1}. ${file}`).join('\n');

    // Envía la lista
    await m.reply(`Ejecutor de Scripts. Lea como Usarlo Aqui:  \n\n${fileList}`);
  } catch (error) {
    console.error('Error al listar los scripts:', error);
    await m.reply('❌ Error al listar los scripts');
  }
};

const handleExecuteScript = async (m, scriptNumber) => {
  try {
    const files = fs.readdirSync(scriptsDirectory);

    // Verifica el número del script
    if (scriptNumber > 0 && scriptNumber <= files.length) {
      const scriptFile = files[scriptNumber - 1];
      const scriptPath = `${scriptsDirectory}/${scriptFile}`;

      // Dependiendo de la extensión abrirá PowerShell, Bash o en caso de que sea js lo hará en node.
      let command;
      if (scriptFile.endsWith('.js')) {
        command = `node "${scriptPath}"`;
      } else if (scriptFile.endsWith('.sh')) {
        command = `bash "${scriptPath}"`;
      } else if (scriptFile.endsWith('.ps1')) {
        command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
      } else {
        await m.reply('💢 El script debe ser .sh, .ps1 o .js');
        return;
      }

      // Envía el mensaje de "Ejecutando, espere"
      await m.reply('⏳ Ejecutando...');

      // Ejecuta el script con un buffer de salida aumentado
      exec(command, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => { // Aumenta el buffer a 500 KB
        if (error) {
          console.error(`Error ejecutando el script: ${error}`);
          m.reply(`💢 Error ejecutando el script: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Error en el script: ${stderr}`);
          m.reply(`❌ Error en el script: ${stderr}`);
          return;
        }
        m.reply(`✔️ Resultado:\n${stdout}`);
      });
    } else {
      await m.reply('💢 Por favor, proporciona un número válido de la lista.');
    }
  } catch (error) {
    console.error('Error al ejecutar el script', error);
    await m.reply('❌ Error al ejecutar el script');
  }
};

let handler = async (m) => {
  // Captura el mensaje sin el comando
  const commandArgument = m.text.trim().split(' ')[1];

  if (!commandArgument) {
    await handleListScripts(m);
  } else {
    const scriptNumber = parseInt(commandArgument, 10);
    if (!isNaN(scriptNumber)) {
      await handleExecuteScript(m, scriptNumber);
    } else {
      await m.reply('💢 Por favor, proporciona un número válido de la lista.');
    }
  }
};

handler.help = ['Instalacion de Plugins'];
handler.tags = ['tools'];
handler.command = /^(install)$/i;
handler.owner = true;

export default handler;
