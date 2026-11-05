const http = require('http');

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write("Double-Bot Security System is running 24x7!");
    res.end();
}).listen(process.env.PORT || 8080);

// ================= APNI DETAILS YAHAN DALEIN =================
const ADMIN_BOT_TOKEN = '8226983471:AAGrdGH8mO5IwJp54OS1v5ysbBKY64W6u4M'; 
const PUBLIC_BOT_TOKEN = '9133978108:AAEAfzcrSJ9IHXqStjrPvYjDAEWsZiV5-qM'; 

const MAIN_CHANNEL_ID = '-1004339756508'; 
const DB_CHANNEL_ID = '-1003963018645'; 

const MY_TELEGRAM_ID = 5850723556; // <-- Aapki verified Telegram Numeric ID

const PUBLIC_BOT_USERNAME = 'ApkFileStorezbot'; 
const SHORTENER_API = '0d5b84a85b367dce300ef3f2be81b302202e9803';
// ============================================================

let adminLastUpdateId = 0;
let publicLastUpdateId = 0;

console.log("🤖 Double-Bot Security & Privacy System Chalu Ho Gaya Hai!");

// --- ADMIN BOT KAA KAAM ---
async function pollAdmin() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/getUpdates?offset=${adminLastUpdateId + 1}&timeout=30`);
        const data = await res.json();
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                adminLastUpdateId = update.update_id;
                await processAdminMessage(update.message);
            }
        }
    } catch (e) {}
    setTimeout(pollAdmin, 1000);
}

async function processAdminMessage(msg) {
    if (!msg || msg.chat.type !== 'private') return;
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    let text = msg.text || msg.caption || '';

    // 🛡️ Privacy Lock Check
    if (userId !== MY_TELEGRAM_ID) {
        await sendMessage(ADMIN_BOT_TOKEN, chatId, "⛔ **Access Denied!**\n\nYeh ek private Admin Bot hai.");
        return;
    }

    // 🔥 Fixed Regex jo private channel (t.me/c/...) aur normal links dono ko pakad lega
    const tgLinkRegex = /https:\/\/t\.me\/(?:c\/(\d+)\/([^\s]+)|([a-zA-Z0-9_]+)\/(\d+))/;
    const match = text.match(tgLinkRegex);

    if (match) {
        // Message ID nikalne ka secure tarika (chahe private link ho ya public)
        const fileMsgId = match[2] || match[4]; 
        
        if (!fileMsgId) {
            sendMessage(ADMIN_BOT_TOKEN, chatId, "❌ Link se Message ID extract nahi ho payi. Sahi link bhejein.");
            return;
        }

        const secretBotLink = `https://telegram.me/${PUBLIC_BOT_USERNAME.trim()}?start=${fileMsgId}`;

        try {
            const shortRes = await fetch(`https://shrinkme.io/api?api=${SHORTENER_API}&url=${encodeURIComponent(secretBotLink)}`);
            const shortData = await shortRes.json();
            
            if (shortData.status === 'success') {
                const finalLink = shortData.shortenedUrl;
                text = text.replace(match[0], ''); 
                
                const replyMarkup = { inline_keyboard: [[{ text: '📥 Download Mod APK', url: finalLink }]] };

                let postRes;
                if (msg.photo) {
                    const fileId = msg.photo[msg.photo.length - 1].file_id;
                    postRes = await sendPhoto(ADMIN_BOT_TOKEN, MAIN_CHANNEL_ID, fileId, text, replyMarkup);
                } else {
                    postRes = await sendMessage(ADMIN_BOT_TOKEN, MAIN_CHANNEL_ID, text, replyMarkup);
                }
                
                if(postRes.ok) {
                    sendMessage(ADMIN_BOT_TOKEN, chatId, "🎉 Post Successfully Main Channel par bhej di gayi hai!");
                } else {
                    sendMessage(ADMIN_BOT_TOKEN, chatId, "❌ Main channel par post bhejte waqt error aaya.");
                }
            } else {
                sendMessage(ADMIN_BOT_TOKEN, chatId, "❌ ShrinkMe API error: Link short nahi ho paya.");
            }
        } catch (e) {
            sendMessage(ADMIN_BOT_TOKEN, chatId, "❌ Link convert karne mein network error aaya.");
        }
    } else {
        if (text === '/start') {
            sendMessage(ADMIN_BOT_TOKEN, chatId, "👋 **Welcome Boss!**\n\nAdmin Security Panel active hai. Database channel se file ka link copy karke yahan bhejein!");
        } else {
            sendMessage(ADMIN_BOT_TOKEN, chatId, "⚠️ Kripya Database Channel se file ka valid Telegram link bhejें।");
        }
    }
}

// --- PUBLIC BOT KAA KAAM ---
async function pollPublic() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${PUBLIC_BOT_TOKEN}/getUpdates?offset=${publicLastUpdateId + 1}&timeout=30`);
        const data = await res.json();
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                publicLastUpdateId = update.update_id;
                await processPublicMessage(update.message);
            }
        }
    } catch (e) {}
    setTimeout(pollPublic, 1000);
}

async function processPublicMessage(msg) {
    if (!msg || msg.chat.type !== 'private') return;
    const chatId = msg.chat.id;
    const text = msg.text || '';

    if (text.startsWith('/start ')) {
        const fileMsgId = text.split(' ')[1];
        if (fileMsgId) {
            await sendMessage(PUBLIC_BOT_TOKEN, chatId, "⏳ Aapki file dhoondh raha hoon...");
            const res = await copyMessage(PUBLIC_BOT_TOKEN, chatId, DB_CHANNEL_ID, fileMsgId);
            if (!res.ok) {
                await sendMessage(PUBLIC_BOT_TOKEN, chatId, "❌ File nahi mili ya link expired ho gaya hai.");
            }
        }
        return;
    }

    if (text === '/start') {
        await sendMessage(PUBLIC_BOT_TOKEN, chatId, "👋 Welcome! Kripya hamare Channel ke link ke through aayein.");
    }
}

// --- TELEGRAM HELPER APIS ---
async function sendMessage(token, chat_id, text, reply_markup = null) {
    const body = { chat_id, text, parse_mode: 'Markdown' };
    if (reply_markup) body.reply_markup = reply_markup;
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return await res.json();
}
async function sendPhoto(token, chat_id, photo, caption, reply_markup) {
    const body = { chat_id, photo, caption, reply_markup, parse_mode: 'Markdown' };
    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return await res.json();
}
async function copyMessage(token, chat_id, from_chat_id, message_id) {
    const body = { chat_id, from_chat_id, message_id };
    const res = await fetch(`https://api.telegram.org/bot${token}/copyMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return await res.json();
}

pollAdmin();
pollPublic();
