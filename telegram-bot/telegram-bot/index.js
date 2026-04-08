const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');
const crypto = require('crypto');

const SESSION_TTL_MS = Number(process.env.TELEGRAM_SESSION_TTL_MS || 15 * 60 * 1000);
const SESSION_CLEANUP_INTERVAL_MS = Number(process.env.TELEGRAM_SESSION_CLEANUP_INTERVAL_MS || 5 * 60 * 1000);
const REPORT_SOURCE = 'telegram';
const CATEGORY_TO_DEPARTMENT = {
    'Roads & Potholes': 'Road Maintenance Department',
    'Garbage & Cleaning': 'Solid Waste Management Department',
    'Streetlights': 'Electrical Maintenance Department',
    'Water & Drainage': 'Water and Drainage Department',
    'Other': 'Ward Civic Support Department',
};

function loadServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        } catch (error) {
            throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${error.message}`);
        }
    }

    const candidates = [
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
        process.env.GOOGLE_APPLICATION_CREDENTIALS,
        path.join(__dirname, 'civix-firebase-adminsdk.json')
    ].filter(Boolean);

    let lastError = null;
    for (const candidate of candidates) {
        const resolvedPath = path.resolve(candidate);

        if (!fs.existsSync(resolvedPath)) {
            continue;
        }

        try {
            const fileContents = fs.readFileSync(resolvedPath, 'utf8');
            return JSON.parse(fileContents);
        } catch (error) {
            lastError = error;
        }
    }

    if (lastError) {
        throw new Error(`Failed to load Firebase service account credentials: ${lastError.message}`);
    }

    throw new Error(
        'Missing Firebase service account credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.'
    );
}

const serviceAccount = loadServiceAccount();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket:
        process.env.FIREBASE_STORAGE_BUCKET ||
        process.env.VITE_FIREBASE_STORAGE_BUCKET ||
        `${serviceAccount.project_id}.appspot.com`
});
const db = admin.firestore();
const bucket = admin.storage().bucket();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const userSessions = {};

function touchSession(session) {
    session.lastUpdated = Date.now();
    return session;
}

function cleanupExpiredSessions() {
    const expiryCutoff = Date.now() - SESSION_TTL_MS;

    for (const [userId, session] of Object.entries(userSessions)) {
        if (!session || (session.lastUpdated || 0) < expiryCutoff) {
            delete userSessions[userId];
        }
    }
}

function getCategoryDepartment(category) {
    return CATEGORY_TO_DEPARTMENT[category] || CATEGORY_TO_DEPARTMENT.Other;
}

async function uploadTelegramPhotoToStorage(photoId, reportId) {
    const fileLink = await bot.telegram.getFileLink(photoId);
    const response = await fetch(fileLink.href);

    if (!response.ok) {
        throw new Error(`Failed to download Telegram photo: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const storagePath = `telegram-issues/${reportId}/before.${extension}`;
    const file = bucket.file(storagePath);
    const buffer = Buffer.from(await response.arrayBuffer());

    await file.save(buffer, {
        metadata: {
            contentType,
        },
        resumable: false,
    });

    const [photoUrl] = await file.getSignedUrl({
        action: 'read',
        expires: new Date('2500-01-01T00:00:00Z'),
    });

    return { photoUrl, storagePath };
}

const sessionCleanupTimer = setInterval(cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL_MS);
if (typeof sessionCleanupTimer.unref === 'function') {
    sessionCleanupTimer.unref();
}

bot.start((ctx) => {
    ctx.reply('Welcome to CIVIX! To report an issue, please send me a photo of the problem.');
});

bot.on('photo', async (ctx) => {
    const userId = ctx.from.id;
    const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

    userSessions[userId] = touchSession({
        reportId: crypto.randomUUID(),
        claimToken: crypto.randomUUID(),
        photoId,
        photoUrl: null,
        photoStoragePath: null,
        category: '',
        description: '',
        report_source: REPORT_SOURCE,
        awaitingDescription: false,
        submitting: false,
        lastUpdated: Date.now(),
    });

    ctx.reply(
        'Photo received. What kind of issue is this?',
        Markup.inlineKeyboard([
            [Markup.button.callback('Pothole / Road', 'CAT_ROAD'), Markup.button.callback('Garbage', 'CAT_GARBAGE')],
            [Markup.button.callback('Streetlight', 'CAT_LIGHT'), Markup.button.callback('Water/Drainage', 'CAT_WATER')],
            [Markup.button.callback('Other (Specify)', 'CAT_OTHER')],
        ])
    );
});

bot.action(/CAT_(.+)/, (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions[userId];

    if (!session) return ctx.answerCbQuery('Session expired. Please send a photo again.');

    const catCode = ctx.match[0];

    if (catCode === 'CAT_OTHER') {
        session.category = 'Other';
        session.awaitingDescription = true;
        touchSession(session);
        ctx.answerCbQuery();
        return ctx.reply(
            "You selected 'Other'. Please type a short description of the issue, for example: Fallen tree or Stray dogs."
        );
    }

    const categories = {
        CAT_ROAD: 'Roads & Potholes',
        CAT_GARBAGE: 'Garbage & Cleaning',
        CAT_LIGHT: 'Streetlights',
        CAT_WATER: 'Water & Drainage',
    };

    session.category = categories[catCode];
    session.description = session.description || categories[catCode];
    touchSession(session);

    ctx.answerCbQuery();
    ctx.reply(`Got it: ${session.category}. Please send your current location using Telegram's location attachment.`);
});

bot.on('text', (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions[userId];

    if (session && session.awaitingDescription) {
        session.description = ctx.message.text;
        session.awaitingDescription = false;
        session.category = session.category || 'Other';
        touchSession(session);

        return ctx.reply(
            `Got it: ${session.description}. Please send your current location using Telegram's location attachment.`
        );
    }
});

bot.on('location', async (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions[userId];

    if (!session || !session.category) {
        return ctx.reply('Please follow the steps: Photo -> Category -> Location.');
    }

    if (session.submitting) {
        return;
    }

    const { latitude, longitude } = ctx.message.location;
    session.submitting = true;
    touchSession(session);

    try {
        if (!session.photoUrl) {
            const uploadedPhoto = await uploadTelegramPhotoToStorage(session.photoId, session.reportId);
            session.photoUrl = uploadedPhoto.photoUrl;
            session.photoStoragePath = uploadedPhoto.storagePath;
            touchSession(session);
        }

        const category = session.category || 'Other';
        const description = session.description || category;
        const issueId = session.reportId;
        const photoUrl = session.photoUrl;

        const newIssue = {
            claimToken: session.claimToken,
            tokenId: session.claimToken,
            createdBy: null,
            category,
            subcategory: category === 'Other' ? 'Other' : '',
            issue_type: category,
            issue_category: category,
            issue_subcategory: category === 'Other' ? description : '',
            description,
            ai_description: description,
            report_source: REPORT_SOURCE,
            department: getCategoryDepartment(category),
            contractor: '',
            priority: '',
            severity: '',
            neighbourhood: '',
            assignedTo: null,
            photo_url: photoUrl,
            photo_storage_path: session.photoStoragePath,
            beforeImage: photoUrl,
            beforeImageUrl: photoUrl,
            afterImage: null,
            afterImageUrl: null,
            afterUploadMeta: null,
            lat: latitude,
            lng: longitude,
            location: {
                lat: latitude,
                lng: longitude,
                address: '',
            },
            locationLabel: '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            reported_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            status: 'open',
            archived: false,
            verification_photo_url: '',
            verified_by_citizen: false,
            citizenVerification: {
                status: 'pending',
                verifiedAt: null,
            },
            upvotes: 0,
            timeline: [
                {
                    type: 'reported',
                    title: 'Complaint reported',
                    status: 'open',
                    note: description,
                    source: REPORT_SOURCE,
                    createdAt: new Date().toISOString(),
                },
            ],
        };

        await db.collection('issues').doc(issueId).set(newIssue);
        delete userSessions[userId];

        ctx.reply(
            'Issue successfully reported to the municipality! Your city thanks you.',
            Markup.inlineKeyboard([
                [Markup.button.callback('Report Another Issue', 'NEW_REPORT')],
            ])
        );
    } catch (error) {
        console.error('Firebase Error:', error);
        session.submitting = false;
        touchSession(session);
        ctx.reply('Sorry, there was an error connecting to the municipal database.');
    }
});

bot.action('NEW_REPORT', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('Send me a PHOTO of the next issue to get started!');
});

bot.launch();
console.log('CIVIX Telegram Bot is now running...');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
