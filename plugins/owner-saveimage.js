import fs from 'fs';

let handler = async (m) => {
  if (!m.quoted || !m.quoted.fileSha256) {
    throw 'Responde a Archivo.';
  }

  let media = await m.quoted.download();
  let fileName = m.quoted.filename;
  const savePath = `src/RecursosMarcoRota/Instaladores/${fileName}`;

  await fs.promises.writeFile(savePath, media);
  m.reply(`Guardada ${savePath}`);
};

handler.help = ['savefile'];
handler.tags = ['tools'];
handler.command = /^(sv)$/i;
handler.owner = true;

export default handler;
