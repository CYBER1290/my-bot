const http = require('http');
const https = require('https');

// 24x7 Uptime Web Server for Render
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write("All Bots are alive and running 24x7!");
    res.end();
}).listen(process.env.PORT || 8080);

// ================= APNI SAARI DETAILS YAHAN HAIN =================
const ADMIN_BOT_TOKEN = '8226983471:AAGrdGH8mO5IwJp54OS1v5ysbBKY64W6u4M'; 
const AI_BOT_TOKEN = '9231837886:AAExB6NKfnQEs59e8hn3Qg_qQOA8V4q5Y1I';       
const PUBLIC_BOT_TOKEN = '9133978108:AAEAfzcrSJ9IHXqStjrPvYjDAEWsZiV5-qM';  

const MAIN_CHANNEL_ID = '-1004339756508'; 
const DB_CHANNEL_ID = '-1003963018645'; 

const MY_TELEGRAM_ID = 5850723556; 

const PUBLIC_BOT_USERNAME = 'ApkFileStorezbot'; 
const SHORTENER_API = '0d5b84a85b367dce300ef3f2be81b302202e9803';

// Aapki Auth Key / Gemini API Key
const GEMINI_API_KEY = 'AQ.Ab8RN6LYTeW1io4qfEWTwwWU9au87YNfwz7EMoRQkNlBVJDrlg';
// =========================================================================

let adminLastUpdateId = 0;
let aiBotLastUpdateId = 0;
let publicLastUpdateId = 0;
const userStates = {};

console.log("🤖 Ultimate All-in-One Bot System Started with Auth Key Integration!");

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
                try { resolve(JSON.parse(responseData)); } catch (e) { reject(e); }
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
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
        }).on('error', (err) => { reject(err); });
    });
}

function shortenUrl(targetLink) {
    return new Promise((resolve) => {
        const secretBotLink = targetLink.includes('t.me/') && targetLink.split('/').pop() && !isNaN(targetLink.split('/').pop()) 
            ? `https://telegram.me/${PUBLIC_BOT_USERNAME.trim()}?start=${targetLink.split('/').pop()}`
            : targetLink;

        https.get(`https://shrinkme.io/api?api=${SHORTENER_API}&url=${encodeURIComponent(secretBotLink)}`, (sRes) => {
            let sData = '';
            sRes.on('data', (chunk) => { sData += chunk; });
            sRes.on('end', () => {
                try {
                    const shortData = JSON.parse(sData);
                    resolve(shortData.status === 'success' ? shortData.shortenedUrl : null);
                } catch (err) { resolve(null); }
            });
        }).on('error', () => { resolve(null); });
    });
}

// Function to call Gemini API using Bearer Token (Auth Key format)
function generateGeminiContent(promptText) {
    return new Promise((resolve) => {
        const dataString = JSON.stringify({
            contents: [{ parts: [{ text: `Act as a professional viral video editor. For the following movie/anime, generate a catchy Viral Hook, Instagram/YouTube Shorts Caption, and popular hashtags: "${promptText}"` }] }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-1.5-flash:generateContent`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GEMINI_API_KEY}`,
                'Content-Length': Buffer.byteLength(dataString)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (parsed.candidates && parsed.candidates[0].content) {
                        resolve(parsed.candidates[0].content.parts[0].text);
                    } else {
                        resolve("❌ Gemini API se response nahi mila. Kripya response check karein.");
                    }
                } catch (e) {
                    resolve("❌ Error parsing Gemini response.");
                }
            });
        });

        req.on('error', () => { resolve("❌ Network error connecting to Gemini API."); });
        req.write(dataString);
        req.end();
    });
}

async function publishToChannel(chatId, text, photoId, finalLink) {
    const markup = { inline_keyboard: [[{ text: '📥 Download Mod APK', url: finalLink }]] };

    if (photoId) {
        if (text.length > 1024) {
            const firstPart = text.substring(0, 1024);
            const secondPart = text.substring(1024);

            await telegramApi(ADMIN_BOT_TOKEN, 'sendPhoto', { chat_id: MAIN_CHANNEL_ID, photo: photoId, caption: firstPart, parse_mode: 'Markdown', reply_markup: markup });
            await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: MAIN_CHANNEL_ID, text: secondPart, parse_mode: 'Markdown' });
        } else {
            await telegramApi(ADMIN_BOT_TOKEN, 'sendPhoto', { chat_id: MAIN_CHANNEL_ID, photo: photoId, caption: text, parse_mode: 'Markdown', reply_markup: markup });
        }
    } else {
        await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: MAIN_CHANNEL_ID, text: text, parse_mode: 'Markdown', reply_markup: markup });
    }

    await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "🎉 Post Successfully Main Channel par bhej di gayi hai!" });
}

// --- ADMIN BOT ---
async function pollAdmin() {
    try {
        const data = await getUpdates(ADMIN_BOT_TOKEN, adminLastUpdateId + 1);
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                adminLastUpdateId = update.update_id;
                
                if (update.callback_query) {
                    const cq = update.callback_query;
                    const chatId = cq.message.chat.id;
                    const userId = cq.from.id;
                    const dataKey = cq.data;

                    if (userId !== MY_TELEGRAM_ID) continue;
                    await telegramApi(ADMIN_BOT_TOKEN, 'answerCallbackQuery', { callback_query_id: cq.id });

                    const state = userStates[userId];
                    if (!state) {
                        await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "⚠️ Session expire ho gaya hai." });
                        continue;
                    }

                    if (dataKey === 'use_original') {
                        const finalLink = await shortenUrl(state.targetLink);
                        if (!finalLink) {
                            await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "❌ ShrinkMe API Error." });
                            delete userStates[userId];
                            continue;
                        }
                        let cleanText = state.text.replace(state.targetLink, '').trim();
                        await publishToChannel(chatId, cleanText, state.photoId, finalLink);
                        delete userStates[userId];

                    } else if (dataKey === 'use_custom') {
                        userStates[userId].step = 'waiting_for_custom_link';
                        await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "✏️ Apna custom link bhejein:" });
                    }
                    continue;
                }

                const msg = update.message;
                if (!msg || msg.chat.type !== 'private') continue;
                
                const chatId = msg.chat.id;
                const userId = msg.from.id;

                if (userId !== MY_TELEGRAM_ID) {
                    await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "⛔ Access Denied!" });
                    continue;
                }

                const text = msg.text || msg.caption || '';

                if (text === '/start') {
                    delete userStates[userId];
                    await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "👋 **Welcome Boss!** Admin Bot ready hai.", parse_mode: 'Markdown' });
                    continue;
                }

                if (userStates[userId] && userStates[userId].step === 'waiting_for_custom_link') {
                    const customLink = text.trim();
                    const state = userStates[userId];
                    const finalLink = await shortenUrl(customLink);
                    if (!finalLink) {
                        await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "❌ Custom Link short nahi ho paya." });
                        delete userStates[userId];
                        continue;
                    }
                    let cleanText = state.text;
                    if (state.targetLink) cleanText = cleanText.replace(state.targetLink, '').trim();
                    await publishToChannel(chatId, cleanText, state.photoId, finalLink);
                    delete userStates[userId];
                    continue;
                }

                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const matches = text.match(urlRegex);

                if (matches && matches.length > 0) {
                    const targetLink = matches[0];
                    const photoId = msg.photo ? msg.photo[msg.photo.length - 1].file_id : null;

                    userStates[userId] = { text: text, photoId: photoId, targetLink: targetLink, step: 'choose_link_type' };

                    const keyboard = {
                        inline_keyboard: [
                            [
                                { text: '🔗 Use Message Link', callback_data: 'use_original' },
                                { text: '✏️ Enter Custom Link', callback_data: 'use_custom' }
                            ]
                        ]
                    };

                    await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', {
                        chat_id: chatId,
                        text: `🔍 **Link Detected:** \`${targetLink}\``,
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    });
                } else {
                    await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "⚠️ Koi valid link nahi mila." });
                }
            }
        }
    } catch (e) {}
    setTimeout(pollAdmin, 1000);
}

// --- AI BOT ---
async function pollAiBot() {
    try {
        const data = await getUpdates(AI_BOT_TOKEN, aiBotLastUpdateId + 1);
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                aiBotLastUpdateId = update.update_id;
                const msg = update.message;
                if (!msg || msg.chat.type !== 'private') continue;

                const chatId = msg.chat.id;
                const userId = msg.from.id;

                if (userId !== MY_TELEGRAM_ID) {
                    await telegramApi(AI_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "⛔ Access Denied!" });
                    continue;
                }

                const text = msg.text || '';

                if (text === '/start') {
                    await telegramApi(AI_BOT_TOKEN, 'sendMessage', { 
                        chat_id: chatId, 
                        text: "🎬 **AI Viral Hook & Caption Generator**\n\nMovie ya Anime ka naam bhejein!", 
                        parse_mode: 'Markdown' 
                    });
                } else {
                    await telegramApi(AI_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "⏳ Generating viral hooks..." });
                    const aiResult = await generateGeminiContent(text);
                    await telegramApi(AI_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: aiResult, parse_mode: 'Markdown' });
                }
            }
        }
    } catch (e) {}
    setTimeout(pollAiBot, 1000);
}

// --- PUBLIC BOT ---
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
                        await telegramApi(PUBLIC_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "⏳ File bhej raha hoon..." });
                        await telegramApi(PUBLIC_BOT_TOKEN, 'copyMessage', { chat_id: chatId, from_chat_id: DB_CHANNEL_ID, message_id: fileMsgId });
                    }
                } else if (text === '/start') {
                    await telegramApi(PUBLIC_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "👋 Welcome!" });
                }
            }
        }
    } catch (e) {}
    setTimeout(pollPublic, 1000);
}

pollAdmin();
pollAiBot();
pollPublic();
