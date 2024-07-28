let media = 'https://qu.ax/NqZN.mp4'
let handler = async (m, { conn, command }) => {
let fkontak = { "key": { "participants":"0@s.whatsapp.net", "remoteJid": "status@broadcast", "fromMe": false, "id": "Halo" }, "message": { "contactMessage": { "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` }}, "participant": "0@s.whatsapp.net" }
let str = `💙 𝘽𝙄𝙀𝙉𝙑𝙀𝙉𝙄𝘿𝙊
💖 𝙂𝙖𝙩𝙖𝘽𝙤𝙩-𝙈𝘿 🐈
${bot}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
Comunidad: 
https://chat.whatsapp.com/JtrXf1pGoewLlX5Ww2VXDs
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
*Si tienen dudas, sugerencias, o preguntas solo escriban por Instagram.*\n`
await conn.sendButton(m.chat, str, wm, media, [
['𝙂𝙧𝙪𝙥𝙤𝙨🔰', '.grupos'],
['𝘾𝙧𝙚𝙖𝙩𝙤𝙧 💗', '#owner'],
['𝙈𝙚𝙣𝙪 ☘️', '/menu']], null, [
['𝙂𝙖𝙩𝙖𝘽𝙤𝙩-𝙈𝘿', md]], fkontak)}
//conn.sendFile(m.chat, media, 'gata.mp4', str, fkontak)
/*conn.sendHydrated(m.chat, str, wm, media, 'https://xurl.es/REGLAS', 'BasureroOFC', null, null, [
['𝙂𝙧𝙪𝙥𝙤𝙨🔰', '.grupos'],
['𝘾𝙧𝙚𝙖𝙩𝙤𝙧 💗', '#owner'],
['𝙑𝙤𝙡𝙫𝙚𝙧 𝙖𝙡 𝙈𝙚𝙣𝙪́ | 𝘽𝙖𝙘𝙠 𝙩𝙤 𝙈𝙚𝙣𝙪 ☘️', '/menu']
], m,)}*/
handler.command = /^cuentasoficiales|gataig|cuentasgb|cuentagb|accounts|gataaccounts|account|iggata|cuentasdegata|cuentasdegatabot|cuentagatabot|cuentasgatabot$/i
handler.exp = 35
export default handler
