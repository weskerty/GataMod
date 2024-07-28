import fs from 'fs';
import path from 'path';
import RSSParser from 'rss-parser';
import { scheduleJob } from 'node-schedule';
import { fileTypeFromBuffer } from 'file-type';
import axios from 'axios';

const parser = new RSSParser();
const rssFilePath = './src/rss_links.json';
const sentPostsFilePath = './src/sent_posts.json';
let rssLinks = {};
let sentPosts = {};

const loadRSSLinks = () => {
    if (fs.existsSync(rssFilePath)) {
        rssLinks = JSON.parse(fs.readFileSync(rssFilePath, 'utf-8'));
    }
};

const saveRSSLinks = () => {
    fs.writeFileSync(rssFilePath, JSON.stringify(rssLinks, null, 2), 'utf-8');
};

const loadSentPosts = () => {
    if (fs.existsSync(sentPostsFilePath)) {
        sentPosts = JSON.parse(fs.readFileSync(sentPostsFilePath, 'utf-8'));
    }
};

const saveSentPosts = () => {
    fs.writeFileSync(sentPostsFilePath, JSON.stringify(sentPosts, null, 2), 'utf-8');
};

// descargar multimedia, pero no funciona.
const downloadMedia = async (url) => {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const fileType = await fileTypeFromBuffer(response.data);
    const fileName = `media_${Date.now()}.${fileType.ext}`;
    const filePath = path.join('./tmp', fileName);
    fs.writeFileSync(filePath, response.data);
    return { filePath, fileName, mimeType: fileType.mime };
};

const sendMediaMessage = async (conn, chatId, content, mediaUrl) => {
    try {
        const { filePath, fileName, mimeType } = await downloadMedia(mediaUrl);
        await conn.sendMessage(chatId, { image: { url: filePath }, caption: content }, { quoted: null });
        fs.unlinkSync(filePath); 
    } catch (error) {
        console.error('Error sending media message:', error);
    }
};

const toggleRSSLink = async (link, chatId, conn) => {
    if (!rssLinks[chatId]) {
        rssLinks[chatId] = [];
    }

    const index = rssLinks[chatId].indexOf(link);
    if (index === -1) {
        rssLinks[chatId].push(link);
        saveRSSLinks();
        await conn.sendMessage(chatId, { text: `✅ RSS Añadido ${link}` }, { quoted: null });
        await sendLatestPost(link, chatId, conn);
    } else {
        rssLinks[chatId].splice(index, 1);
        saveRSSLinks();
        await conn.sendMessage(chatId, { text: `✔️ RSS Eliminado ${link}` }, { quoted: null });
    }
};

const sendLatestPost = async (link, chatId, conn) => {
    try {
        const feed = await parser.parseURL(link);
        if (feed.items.length > 0) {
            const latestItem = feed.items[0];
            const message = `${latestItem.title}\n${latestItem.link}\n${latestItem.contentSnippet}`;
            if (latestItem.enclosure && latestItem.enclosure.url) {
                await sendMediaMessage(conn, chatId, message, latestItem.enclosure.url);
            } else {
                await conn.sendMessage(chatId, { text: message }, { quoted: null });
            }
            if (!sentPosts[link]) {
                sentPosts[link] = [];
            }
            sentPosts[link].push({ title: latestItem.title, date: new Date().toISOString().split('T')[0] });
            saveSentPosts();
        }
    } catch (error) {
        console.error(`Error fetching RSS feed from ${link}:`, error);
        await conn.sendMessage(chatId, { text: `💢 ${link} fue Agregado, pero no tiene Publicaciones.` }, { quoted: null });
    }
};

const fetchAndSendUpdates = async (conn) => {
    const now = new Date();

    for (const chatId in rssLinks) {
        for (const link of rssLinks[chatId]) {
            try {
                const feed = await parser.parseURL(link);
                for (const item of feed.items) {
                    if (!sentPosts[link] || !sentPosts[link].some(post => post.title === item.title)) {
                        const message = `${item.title}\n${item.link}\n${item.contentSnippet}`;
                        if (item.enclosure && item.enclosure.url) {
                            await sendMediaMessage(conn, chatId, message, item.enclosure.url);
                        } else {
                            await conn.sendMessage(chatId, { text: message }, { quoted: null });
                        }
                        if (!sentPosts[link]) {
                            sentPosts[link] = [];
                        }
                        sentPosts[link].push({ title: item.title, date: new Date().toISOString().split('T')[0] });
                        saveSentPosts();
                    }
                }

                // Limpia registro de post enviados cada 30 dias.
                sentPosts[link] = sentPosts[link].filter(post => {
                    const postDate = new Date(post.date);
                    const diffDays = Math.ceil((now - postDate) / (1000 * 60 * 60 * 24));
                    return diffDays <= 30;
                });
                saveSentPosts();
            } catch (error) {
                console.error(`Error fetching RSS feed from ${link}:`, error);
            }
        }
    }
};

// Tiempo de busqueda ajustable. Actual cada 45 minutos. Leer documentacion https://github.com/node-schedule/node-schedule
const startScheduledJob = (conn) => {
    scheduleJob('*/45 * * * *', () => fetchAndSendUpdates(conn));
};

const handleIncomingMessage = async (msg, conn) => {
    const messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    const from = msg.key.remoteJid;

    if (messageContent && messageContent.startsWith('.rss')) {
        const [, link] = messageContent.split(' ');
        if (link) {
            await toggleRSSLink(link, from, conn);
        } else {
            await conn.sendMessage(from, { text: '💢 RSS link...' }, { quoted: null });
        }
    }
};

const handler = async (m, { conn }) => {
    loadRSSLinks();
    loadSentPosts();
    await handleIncomingMessage(m, conn);
    startScheduledJob(conn);
};

handler.help = ['RSS'];
handler.tags = ['tools'];
handler.command = /^rss$/i;
handler.owner = false;

export default handler;
