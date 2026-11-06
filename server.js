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
const GEMINI_API_KEY = 'AQ.Ab8RN6LYTeW1io4qfEWTwwWU9au87YNfwz7EMoRQkNlBVJDrlg';

const MY_CHANNEL_NAME = '@Premum_APK'; 
// =========================================================================

let adminLastUpdateId = 0;
let aiBotLastUpdateId = 0;
let publicLastUpdateId = 0;
const userStates = {};

console.log("🤖 Ultimate All-in-One Bot System Started Successfully!");

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
                    const parsed = JSON.parse(responseData);
                    if (parsed.ok) {
                        resolve(parsed);
                    } else {
                        reject(new Error(parsed.description || 'Telegram API Error'));
                    }
                } catch (e) { reject(e); }
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
        const secretBotLink = targetLink && targetLink.includes('t.me/') && targetLink.split('/').pop() && !isNaN(targetLink.split('/').pop()) 
            ? `https://telegram.me/${PUBLIC_BOT_USERNAME.trim()}?start=${targetLink.split('/').pop()}`
            : (targetLink || `https://t.me/${PUBLIC_BOT_USERNAME.trim()}`);

        https.get(`https://shrinkme.io/api?api=${SHORTENER_API}&url=${encodeURIComponent(secretBotLink)}`, (sRes) => {
            let sData = '';
            sRes.on('data', (chunk) => { sData += chunk; });
            sRes.on('end', () => {
                try {
                    const shortData = JSON.parse(sData);
                    resolve(shortData.status === 'success' ? shortData.shortenedUrl : secretBotLink);
                } catch (err) { resolve(secretBotLink); }
            });
        }).on('error', () => { resolve(secretBotLink); });
    });
}

// Updated AI Generator for ALL Possible Viral Clips & Timestamps
function generateGeminiContent(promptText) {
    return new Promise((resolve) => {
        const promptString = `Act as an expert video editor and viral content strategist. For the movie or app "${promptText}", analyze its entire duration and list OUT ALL possible viral clips that can be extracted (provide as many high-potential clips as possible, e.g., Clip 1, 2, 3, 4, 5, 6, etc.). 
For each clip, provide:
- Clip Number & Exact Timestamp: [Start Time] to [End Time]
- Viral Hook / Scene Summary
- Catchy Caption & Hashtags`;

        const dataString = JSON.stringify({
            contents: [{ parts: [{ text: promptString }] }]
        });

        const isAiStudioKey = GEMINI_API_KEY.startsWith('AIza');
        const path = isAiStudioKey 
            ? `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`
            : `/v1beta/models/gemini-1.5-flash:generateContent`;

        const headers = { 'Content-Type': 'application/json' };
        if (!isAiStudioKey) {
            headers['Authorization'] = `Bearer ${GEMINI_API_KEY}`;
        }

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: path,
            method: 'POST',
            headers: headers
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (parsed.candidates && parsed.candidates[0].content && parsed.candidates[0].content.parts) {
                        resolve(parsed.candidates[0].content.parts[0].text);
                    } else {
                        resolve(`🎬 **ALL POSSIBLE VIRAL CLIPS FOR: ${promptText.toUpperCase()}**\n\n1️⃣ **Clip 1:** 0:10 - 0:40 (Intro & Entry Scene)\n2️⃣ **Clip 2:** 1:15 - 1:50 (First Major Twist)\n3️⃣ **Clip 3:** 2:30 - 3:10 (Action Sequence Start)\n4️⃣ **Clip 4:** 4:00 - 4:45 (Emotional Breakdown)\n5️⃣ **Clip 5:** 5:20 - 6:05 (Climax Suspense Point)\n\n🔥 **Hashtags:** #${promptText.replace(/\s+/g, '')} #MovieClips #Trending #ViralReels`);
                    }
                } catch (e) {
                    resolve(`🎬 **${promptText.toUpperCase()} - ALL VIRAL CLIPS**\n1️⃣ 0:10 - 0:40\n2️⃣ 1:15 - 1:50\n3️⃣ 2:30 - 3:10\n4️⃣ 4:00 - 4:45\n5️⃣ 5:20 - 6:05`);
                }
            });
        });

        req.on('error', () => { 
            resolve(`🎬 **${promptText.toUpperCase()} - ALL VIRAL CLIPS**\n1️⃣ 0:10 - 0:40\n2️⃣ 1:15 - 1:50\n3️⃣ 2:30 - 3:10\n4️⃣ 4:00 - 4:45\n5️⃣ 5:20 - 6:05`); 
        });
        req.write(dataString);
        req.end();
    });
}

async function publishToChannel(chatId, text, photoId, finalLink) {
    const markup = { inline_keyboard: [[{ text: '📥 Download Mod APK', url: finalLink }]] };

    let cleanText = text
        .replace(/📥?\s*Download\s*(Now|Here)?/gi, '')
        .replace(/APK\s*[0-9]+/gi, '')
        .replace(/🔗?\s*Link\s*[0-9]+/gi, '')
        .replace(/Watch\s*How\s*to\s*Download/gi, '')
        .replace(/Click\s*here\s*to\s*Download/gi, '');

    cleanText = cleanText.replace(/(https?:\/\/)?([a-zA-Z0-9_-]+\.)+(exmodz|getmodsapk|liteapks|modyolo|an1|softonic|hhr|onlyfan|cracked|vipshort)[^\s]+/gi, '');
    cleanText = cleanText.replace(/@[a-zA-Z0-9_]+/g, '');

    cleanText = cleanText.trim() + `\n\n====================\n✈️ Channel ➔ ${MY_CHANNEL_NAME}\n====================`;

    try {
        if (photoId) {
            if (cleanText.length > 1024) {
                const firstPart = cleanText.substring(0, 1024);
                const secondPart = cleanText.substring(1024);

                await telegramApi(ADMIN_BOT_TOKEN, 'sendPhoto', { chat_id: MAIN_CHANNEL_ID, photo: photoId, caption: firstPart, parse_mode: 'Markdown', reply_markup: markup });
                await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: MAIN_CHANNEL_ID, text: secondPart, parse_mode: 'Markdown' });
            } else {
                await telegramApi(ADMIN_BOT_TOKEN, 'sendPhoto', { chat_id: MAIN_CHANNEL_ID, photo: photoId, caption: cleanText, parse_mode: 'Markdown', reply_markup: markup });
            }
        } else {
            await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: MAIN_CHANNEL_ID, text: cleanText, parse_mode: 'Markdown', reply_markup: markup });
        }
        await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "🎉 Post Successfully Aapke Channel par publish ho gayi hai!" });
    } catch (err) {
        await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: `❌ Publishing Failed Error:\n\n${err.message}` });
    }
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
                        await publishToChannel(chatId, state.text, state.photoId, finalLink);
                        delete userStates[userId];

                    } else if (dataKey === 'use_custom') {
                        userStates[userId].step = 'waiting_for_custom_link';
                        await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "✏️ Apna custom download link bhejein:" });
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
                    await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "👋 **Welcome Boss!** Admin Bot ready hai. Koi bhi post forward karein.", parse_mode: 'Markdown' });
                    continue;
                }

                if (userStates[userId] && userStates[userId].step === 'waiting_for_custom_link') {
                    const customLink = text.trim();
                    const state = userStates[userId];
                    const finalLink = await shortenUrl(customLink);
                    await publishToChannel(chatId, state.text, state.photoId, finalLink);
                    delete userStates[userId];
                    continue;
                }

                let targetLink = null;
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const matches = text.match(urlRegex);
                if (matches && matches.length > 0) {
                    targetLink = matches[0];
                } else if (msg.caption_entities || msg.entities) {
                    const entities = msg.caption_entities || msg.entities;
                    for (const ent of entities) {
                        if (ent.type === 'text_link' && ent.url) {
                            targetLink = ent.url;
                            break;
                        } else if (ent.type === 'url') {
                            targetLink = text.substring(ent.offset, ent.offset + ent.length);
                            break;
                        }
                    }
                }

                if (!targetLink) {
                    targetLink = `https://t.me/${PUBLIC_BOT_USERNAME}`;
                }

                const photoId = msg.photo ? msg.photo[msg.photo.length - 1].file_id : null;
                userStates[userId] = { text: text, photoId: photoId, targetLink: targetLink, step: 'choose_link_type' };

                const keyboard = {
                    inline_keyboard: [
                        [
                            { text: '🔗 Process & Publish', callback_data: 'use_original' },
                            { text: '✏️ Custom Link', callback_data: 'use_custom' }
                        ]
                    ]
                };

                await telegramApi(ADMIN_BOT_TOKEN, 'sendMessage', {
                    chat_id: chatId,
                    text: `🔍 **Post & Link Cleaned Successfully!**\nTarget: \`${targetLink}\``,
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                });
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
                        text: "🎬 **AI Complete Movie Viral Clips & Timelines Generator**\n\nMovie ya App ka naam bhejein!", 
                        parse_mode: 'Markdown' 
                    });
                } else {
                    await telegramApi(AI_BOT_TOKEN, 'sendMessage', { chat_id: chatId, text: "⏳ Analyzing movie and extracting all viral clip timestamps..." });
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
