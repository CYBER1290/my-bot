const http = require('http');

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

const MY_TELEGRAM_ID = 5850723556; // Aapki Telegram Numeric ID

const PUBLIC_BOT_USERNAME = 'ApkFileStorezbot'; 
const SHORTENER_API = '0d5b84a85b367dce300ef3f2be81b302202e9803';
// ============================================================

let adminLastUpdateId = 0;
let publicLastUpdateId = 0;

console.log("🤖 Bot polling started successfully!");

// --- HELPER FUNCTIONS ---
async function sendMsg(token, chatId, text, markup = null) {
    try {
        const body = { chat_id: chatId, text: text, parse_mode: 'Markdown' };
        if (markup) body.reply_markup = markup;
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch (e) {}
}

async function sendPhotoMsg(token, chatId, photo, caption, markup) {
    try {
        const body = { chat_id: chatId, photo: photo, caption: caption, parse_mode: 'Markdown', reply_markup: markup };
        await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch (e) {}
}

// --- ADMIN BOT POLLING ---
async function pollAdmin() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/getUpdates?offset=${adminLastUpdateId + 1}&timeout=30`);
        const data = await res.json();
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                adminLastUpdateId = update.update_id;
                const msg = update.message;
                if (!msg || msg.chat.type !== 'private') continue;
                
                const chatId = msg.chat.id;
                const userId = msg.from.id;
                const text = msg.text || msg.caption || '';

                // Privacy Check
                if (userId !== MY_TELEGRAM_ID) {
                    await sendMsg(ADMIN_BOT_TOKEN, chatId, "⛔ **Access Denied!** Yeh ek private Admin Bot hai.");
                    continue;
                }

                if (text === '/start') {
                    await sendMsg(ADMIN_BOT_TOKEN, chatId, "👋 **Welcome Boss!**\n\nDatabase channel se file ka link copy karke yahan bhejein!");
                    continue;
                }

                // Link matcher for Telegram messages
                const match = text.match(/https:\/\/t\.me\/(?:c\/(\d+)\/([^\s]+)|([a-zA-Z0-9_]+)\/(\d+))/);
                if (match) {
                    const fileMsgId = match[2] || match[4];
                    const secretBotLink = `https://telegram.me/${PUBLIC_BOT_USERNAME.trim()}?start=${fileMsgId}`;

                    try {
                        const shortRes = await fetch(`https://shrinkme.io/api?api=${SHORTENER_API}&url=${encodeURIComponent(secretBotLink)}`);
                        const shortData = await shortRes.json();
                        
                        if (shortData.status === 'success') {
                            const finalLink = shortData.shortenedUrl;
                            const cleanText = text.replace(match[0], '').trim();
                            const markup = { inline_keyboard: [[{ text: '📥 Download Mod APK', url: finalLink }]] };

                            if (msg.photo) {
                                const photoId = msg.photo[msg.photo.length - 1].file_id;
                                await sendPhotoMsg(ADMIN_BOT_TOKEN, MAIN_CHANNEL_ID, photoId, cleanText, markup);
                            } else {
                                await sendMsg(ADMIN_BOT_TOKEN, MAIN_CHANNEL_ID, cleanText, markup);
                            }
                            await sendMsg(ADMIN_BOT_TOKEN, chatId, "🎉 Post Successfully Main Channel par bhej di gayi hai!");
                        } else {
                            await sendMsg(ADMIN_BOT_TOKEN, chatId, "❌ ShrinkMe API Error: Link short nahi ho paya.");
                        }
                    } catch (err) {
                        await sendMsg(ADMIN_BOT_TOKEN, chatId, "❌ Network Error while shortening link.");
                    }
                } else {
                    await sendMsg(ADMIN_BOT_TOKEN, chatId, "⚠️ Kripya valid Telegram link bhejein.");
                }
            }
        }
    } catch (e) {}
    setTimeout(pollAdmin, 1000);
}

// --- PUBLIC BOT POLLING ---
async function pollPublic() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${PUBLIC_BOT_TOKEN}/getUpdates?offset=${publicLastUpdateId + 1}&timeout=30`);
        const data = await res.json();
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
                        await sendMsg(PUBLIC_BOT_TOKEN, chatId, "⏳ Aapki file bhej raha hoon...");
                        try {
                            await fetch(`https://api.telegram.org/bot${PUBLIC_BOT_TOKEN}/copyMessage`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ chat_id: chatId, from_chat_id: DB_CHANNEL_ID, message_id: fileMsgId })
                            });
                        } catch (err) {
                            await sendMsg(PUBLIC_BOT_TOKEN, chatId, "❌ File bhejane mein error aaya.");
                        }
                    }
                } else if (text === '/start') {
                    await sendMsg(PUBLIC_BOT_TOKEN, chatId, "👋 Welcome! Kripya Channel ke link ke through aayein.");
                }
            }
        }
    } catch (e) {}
    setTimeout(pollPublic, 1000);
}

pollAdmin();
pollPublic();
