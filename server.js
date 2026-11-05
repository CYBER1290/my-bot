const http = require('http');
const https = require('https');

// 24x7 Uptime Web Server
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write("Bot is alive and running 24x7!");
    res.end();
}).listen(process.env.PORT || 8080);

// ================= APNI DETAILS YAHAN DALEIN =================
const ADMIN_BOT_TOKEN = '8226983471:AAGrdGH8mO5IwJp54OS1v5ysbBKY64W6u4M'; 
const PUBLIC_BOT_TOKEN = '9133978108:AAEAfzcrSJ9IHXqStjrPvYjDAEWsZiV5-qM'; 

const MAIN_CHANNEL_ID = '-1004339756508'; 
const DB_CHANNEL_ID = '-1003963018645'; 

const PUBLIC_BOT_USERNAME = 'ApkFileStorezbot'; 
const SHORTENER_API = '0d5b84a85b367dce300ef3f2be81b302202e9803';
// ============================================================

let adminLastUpdateId = 0;
let publicLastUpdateId = 0;

console.log("🤖 HTTPS-Based Bot Polling Started (Privacy Lock Removed)!");

function telegramApi(token, method, data = {}) {
    return new Promise((resolve, reject) => {
        const dataString = JSON.stringify(data);
        const options = {
            hostname: 'api.telegram.org',
            path: `/bot${token}/${method}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(dataString)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (err) => { reject(err); });
        req.write(dataString);
        req.end();
    });
}

function getUpdates(token, offset) {
    return new Promise((resolve, reject) => {
        https.get(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30`, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => { reject(err); });
    });
}

// --- ADMIN BOT POLLING ---
async function pollAdmin() {
    try {
        const data = await getUpdates(ADMIN_BOT_TOKEN, adminLastUpdateId + 1);
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                adminLastUpdateId = update.update_id;
                const msg = update.message;
                if (!msg || msg.chat.type !== 'private') continue;
                
                const chatId = msg.chat.id;
                const text = msg.text || msg.caption || '';

                if (text === '/start') {
                    await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "👋 **Welcome Boss!**\n\nDatabase channel se file ka link copy karke yahan bhejein!", parse_mode: 'Markdown' });
                    continue;
                }

                const match = text.match(/https:\/\/t\.me\/(?:c\/(\d+)\/([^\s]+)|([a-zA-Z0-9_]+)\/(\d+))/);
                if (match) {
                    const fileMsgId = match[2] || match[4];
                    const secretBotLink = `https://telegram.me/${PUBLIC_BOT_USERNAME.trim()}?start=${fileMsgId}`;

                    https.get(`https://shrinkme.io/api?api=${SHORTENER_API}&url=${encodeURIComponent(secretBotLink)}`, (sRes) => {
                        let sData = '';
                        sRes.on('data', (chunk) => { sData += chunk; });
                        sRes.on('end', async () => {
                            try {
                                const shortData = JSON.parse(sData);
                                if (shortData.status === 'success') {
                                    const finalLink = shortData.shortenedUrl;
                                    const cleanText = text.replace(match[0], '').trim();
                                    const markup = { inline_keyboard: [[{ text: '📥 Download Mod APK', url: finalLink }]] };

                                    if (msg.photo) {
                                        const photoId = msg.photo[msg.photo.length - 1].file_id;
                                        await telegramApi(ADMIN_BOT_TOKEN, 'sendPhoto', { chat_id: MAIN_CHANNEL_ID, photo: photoId, caption: cleanText, parse_mode: 'Markdown', reply_markup: markup });
                                    } else {
                                        await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: MAIN_CHANNEL_ID, text: cleanText, parse_mode: 'Markdown', reply_markup: markup });
                                    }
                                    await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "🎉 Post Successfully Main Channel par bhej di gayi hai!" });
                                } else {
                                    await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "❌ ShrinkMe API Error: Link short nahi ho paya." });
                                }
                            } catch (err) {
                                await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "❌ Error processing short link." });
                            }
                        });
                    });
                } else {
                    await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "⚠️ Kripya valid Telegram link bhejein." });
                }
            }
        }
    } catch (e) {}
    setTimeout(pollAdmin, 1000);
}

// --- PUBLIC BOT POLLING ---
async function pollPublic() {
    try {
        const data = await getUpdates(PUBLIC_BOT_TOKEN, publicLastUpdateId + 1);
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                publicLastUpdateId = update.update_id;
                const msg = update.message;
                if (!msg || msg.chat.type !== 'private') continue;

                const chatId = msg.chat.id;
                const text = msg.text || '';

                if (text.startsWith('/start ')) {
                    const fileMsgId = text.split(' ')[1];
                    if (fileMsgId) {
                        await telegramApi(PUBLIC_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "⏳ Aapki file bhej raha hoon..." });
                        await telegramApi(PUBLIC_BOT_TOKEN, 'copyMessage', { chat_id: chatId, from_chat_id: DB_CHANNEL_ID, message_id: fileMsgId });
                    }
                } else if (text === '/start') {
                    await telegramApi(PUBLIC_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "👋 Welcome! Kripya Channel ke link ke through aayein." });
                }
            }
        }
    } catch (e) {}
    setTimeout(pollPublic, 1000);
}

pollAdmin();
pollPublic();
