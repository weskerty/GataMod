import { exec } from 'child_process';

const handler = async (m, { isOwner }) => {
  if (!isOwner) return;
  if (!m.text.startsWith('.ej')) return;
  const command = m.text.slice(3).trim();
  await m.reply('⌛ Ejecutando');
  exec(command, (error, stdout, stderr) => {
    if (error) {
      m.reply(`❌ \n\n${error.message}`);
      return;
    }
    if (stderr) {
      m.reply(`❌ \n\n${stderr}`);
      return;
    }
    m.reply(`✔️ \n\n${stdout}`);
  });
};

handler.command = /^\ej/;
handler.owner = true;
export default handler;
