// ====== 24x7 ALIVE WEB SERVER ======
const http = require('http');
http.createServer((req, res) => {
    res.write("Bot zinda hai aur 24x7 chal raha hai!");
    res.end();
}).listen(8080);

// ====== PUBLIC BOT KI DETAILS ======
const PUBLIC_BOT_TOKEN = '9133978108:AAEAfzcrSJ9IHXqStjrPvYjDAEWsZiV5-qM'; 
const DB_CHANNEL_ID = '-1003963018645'; 
// ===================================

let lastUpdateId = 0;
console.log("🟢 24x7 Public File Bot chalu ho gaya (Auto-Delete ke sath)!");

async function poll() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${PUBLIC_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
        const data = await res.json();
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                lastUpdateId = update.update_id;
                await processMessage(update.message);
            }
        }
    } catch (e) {}
    setTimeout(poll, 1000);
}

async function processMessage(msg) {
    if (!msg || msg.chat.type !== 'private') return;
    const chatId = msg.chat.id;
    const text = msg.text || '';

    if (text.startsWith('/start ')) {
        const fileMsgId = text.split(' ')[1];
        if (fileMsgId) {
            // User ko warning dena ki file delete ho jayegi
            await fetch(`https://api.telegram.org/bot${PUBLIC_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: "⏳ File dhoondh raha hoon...\n\n⚠️ *Dhyan rahe:* Yeh file 24 ghante mein aapki chat se automatically delete ho jayegi!", parse_mode: 'Markdown' }) });
            
            // File bhejna aur Message ID save karna
            const copyRes = await fetch(`https://api.telegram.org/bot${PUBLIC_BOT_TOKEN}/copyMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, from_chat_id: DB_CHANNEL_ID, message_id: fileMsgId }) });
            const copyData = await copyRes.json();

            // Auto-Delete Time Bomb Logic
            if(copyData.ok) {
                const sentMsgId = copyData.result.message_id;
                
                // 24 Ghante (24 * 60 * 60 * 1000 = 86400000 milliseconds) ka Timer
                setTimeout(async () => {
                    await fetch(`https://api.telegram.org/bot${PUBLIC_BOT_TOKEN}/deleteMessage`, { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ chat_id: chatId, message_id: sentMsgId }) 
                    });
                }, 86400000); 
            }
        }
        return;
    }
    if (text === '/start') {
        await fetch(`https://api.telegram.org/bot${PUBLIC_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: "👋 Main ek File Provider Bot hoon. Channel ke link se file lijiye." }) });
    }
}
poll();
