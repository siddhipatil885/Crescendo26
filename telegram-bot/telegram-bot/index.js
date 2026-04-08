require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function loadServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    }

    const candidates = [
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
        process.env.GOOGLE_APPLICATION_CREDENTIALS,
        path.join(__dirname, 'civix-firebase-adminsdk.json')
    ].filter(Boolean);

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return require(candidate);
        }
    }

    throw new Error(
        'Missing Firebase service account credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.'
    );
}

const serviceAccount = loadServiceAccount();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const userSessions = {};

// 1. Start Command
bot.start((ctx) => {
    ctx.reply('Welcome to CIVIX! 🏙️\nTo report an issue, please send me a PHOTO of the problem.');
});

// 2. Listen for Photos
bot.on('photo', async (ctx) => {
    const userId = ctx.from.id;
    const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    const photoUrl = await ctx.telegram.getFileLink(photoId);

    userSessions[userId] = {
        beforeImageUrl: photoUrl.href,
        status: "pending",
        awaitingDescription: false // <-- New flag to track if they clicked "Other"
    };

    // INLINE KEYBOARD: Added the "Other" button
    ctx.reply('Photo received! 📸 What kind of issue is this?',
        Markup.inlineKeyboard([
            [Markup.button.callback('🕳️ Pothole / Road', 'CAT_ROAD'), Markup.button.callback('🗑️ Garbage', 'CAT_GARBAGE')],
            [Markup.button.callback('💡 Streetlight', 'CAT_LIGHT'), Markup.button.callback('💧 Water/Drainage', 'CAT_WATER')],
            [Markup.button.callback('📝 Other (Specify)', 'CAT_OTHER')] // <-- NEW BUTTON
        ])
    );
});

// 3. Handle the Category Button Clicks
bot.action(/CAT_(.+)/, (ctx) => {
    const userId = ctx.from.id;
    if (!userSessions[userId]) return ctx.answerCbQuery("Session expired. Please send a photo again.");

    const catCode = ctx.match[0];

    // --- NEW LOGIC FOR "OTHER" ---
    if (catCode === 'CAT_OTHER') {
        userSessions[userId].awaitingDescription = true; // Turn on the listening mode
        ctx.answerCbQuery();
        return ctx.reply("You selected 'Other'. Please type a short description of the issue (e.g., 'Fallen tree', 'Stray dogs').");
    }

    // Standard category routing
    const categories = {
        'CAT_ROAD': 'Roads & Potholes',
        'CAT_GARBAGE': 'Garbage & Cleaning',
        'CAT_LIGHT': 'Streetlights',
        'CAT_WATER': 'Water & Drainage'
    };

    userSessions[userId].category = categories[catCode];
    ctx.answerCbQuery();
    ctx.reply(`Got it: ${userSessions[userId].category}.\nFinally, please send your CURRENT LOCATION using Telegram's location pin attachment (📎 -> Location).`);
});

// 4. NEW: Listen for typed text (only triggers if they clicked "Other")
bot.on('text', (ctx) => {
    const userId = ctx.from.id;

    // If we have a session AND they are supposed to be typing a description
    if (userSessions[userId] && userSessions[userId].awaitingDescription) {

        // Save what they typed as a custom category (e.g., "Other: Fallen Tree")
        userSessions[userId].category = `Other: ${ctx.message.text}`;
        userSessions[userId].awaitingDescription = false; // Turn the listening mode back off

        return ctx.reply(`Got it: ${userSessions[userId].category}.\nFinally, please send your CURRENT LOCATION using Telegram's location pin attachment (📎 -> Location).`);
    }
});

// 5. Listen for Location & Save to Firebase
bot.on('location', async (ctx) => {
    const userId = ctx.from.id;

    if (!userSessions[userId] || !userSessions[userId].category) {
        return ctx.reply("Please follow the steps: Photo -> Category -> Location.");
    }

    const { latitude, longitude } = ctx.message.location;

    const newIssue = {
        ...userSessions[userId],
        lat: latitude,
        lng: longitude,
        description: "Reported via Telegram Bot",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        archived: false,
        claimToken: "",
        verification_photo_url: "",
        verified_by_citizen: false
    };

    // Remove the temporary flag before saving to the database
    delete newIssue.awaitingDescription;

    try {
        await db.collection('issues').add(newIssue);
        delete userSessions[userId];

        ctx.reply(
            '✅ Issue successfully reported to the municipality! Your city thanks you.',
            Markup.inlineKeyboard([
                [Markup.button.callback('➕ Report Another Issue', 'NEW_REPORT')],
            ])
        );

    } catch (error) {
        console.error("Firebase Error:", error);
        ctx.reply('Sorry, there was an error connecting to the municipal database.');
    }
});

// Handle the "Report Another" button
bot.action('NEW_REPORT', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('Send me a PHOTO of the next issue to get started!');
});

bot.launch();
console.log("CIVIX Telegram Bot is now running...");
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
