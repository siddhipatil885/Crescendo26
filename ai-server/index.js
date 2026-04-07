const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  console.warn("Warning: .env file not loaded. Using existing environment variables.");
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY is missing. Gemini classification will be skipped.");
}

const modelName = process.env.GEMINI_MODEL || "models/gemini-2.0-flash";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: modelName }) : null;

try {
  // Prefer local service account file if present (keeps setup simple).
  // If you want env-based creds instead, replace this block with JSON parsing.
  const serviceAccount = require("./serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.warn(
    "Warning: serviceAccountKey.json not found or invalid. Falling back to default credentials.",
    error.message
  );
  admin.initializeApp();
}

const db = admin.firestore();

// Middleware: Authenticate Firebase ID Token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Middleware: Authorize user role/scope
function authorizeUser(req, res, next) {
  // For now, allow any authenticated user
  // In production, you might check for specific roles/claims
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Middleware: Request logging
function requestLogger(req, res, next) {
  const timestamp = new Date().toISOString();
  const userId = req.user?.uid || 'unauthenticated';
  console.log(`[${timestamp}] ${req.method} ${req.path} - User: ${userId} - IP: ${req.ip}`);
  next();
}

// Rate limiting: 100 requests per 15 minutes per user
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: (req) => req.user?.uid || req.ip, // Use user ID if authenticated, otherwise IP
  message: {
    error: 'Too many requests from this user, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

function getDepartmentByCategory(category) {
  const map = {
    Pothole: "Roads",
    Garbage: "Sanitation",
    "Stray Animal": "Animal Control",
    Streetlight: "Electrical",
    "Water Leakage": "Water",
  };

  return map[category] || "General";
}

function fallbackClassify(rawText) {
  const text = (rawText || "").toLowerCase();

  let category = "Other";
  let priority = "Medium";

  if (text.includes("pothole") || text.includes("road broken")) {
    category = "Pothole";
    priority = "High";
  } else if (text.includes("garbage") || text.includes("trash")) {
    category = "Garbage";
  } else if (
    text.includes("dog") ||
    text.includes("cow") ||
    text.includes("animal")
  ) {
    category = "Stray Animal";
    priority = "High";
  } else if (text.includes("light") || text.includes("streetlight")) {
    category = "Streetlight";
  } else if (text.includes("water") || text.includes("leak")) {
    category = "Water Leakage";
  }

  return {
    category,
    department: getDepartmentByCategory(category),
    priority,
    confidence: 0.9,
  };
}

async function classifyText(text) {
  const fallbackResult = fallbackClassify(text);

  if (!model) {
    return fallbackResult;
  }

  try {
    const prompt = `
You are classifying civic complaints.
Return ONLY valid JSON.
Do not add explanation, markdown, or extra text.
Use this exact format:
{"category":"...","priority":"..."}

Allowed categories: Pothole, Garbage, Stray Animal, Streetlight, Water Leakage, Other.
Priority rules:
- High: dangerous, urgent, accidents
- Medium: normal issues
- Low: minor issues

Complaint: "${text}"
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();
    let parsed;

    try {
      const cleaned = reply.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error(
        "Gemini returned invalid JSON. Using parse fallback.",
        parseError.message
      );
      return fallbackResult;
    }

    const allowedCategories = new Set([
      "Pothole",
      "Garbage",
      "Stray Animal",
      "Streetlight",
      "Water Leakage",
      "Other",
    ]);
    const allowedPriorities = new Set(["High", "Medium", "Low"]);

    const category = allowedCategories.has(parsed?.category)
      ? parsed.category
      : fallbackResult.category;
    const priority = allowedPriorities.has(parsed?.priority)
      ? parsed.priority
      : fallbackResult.priority;

    return {
      category,
      department: getDepartmentByCategory(category),
      priority,
      confidence: 0.9,
    };
  } catch (error) {
    console.error("Gemini classification failed. Using fallback.", error.message);
    return fallbackResult;
  }
}

const app = express();
app.use(express.json());

// Apply rate limiting to all routes
app.use(limiter);

// Apply authentication and logging to protected routes
const protectedRoutes = express.Router();
protectedRoutes.use(authenticateToken);
protectedRoutes.use(authorizeUser);
protectedRoutes.use(requestLogger);

// Protected route: /classify
protectedRoutes.post("/classify", async (req, res) => {
  const text = req.body?.text;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Please provide text as a string." });
  }

  try {
    const result = await classifyText(text);
    return res.json(result);
  } catch (error) {
    console.error("Classification failed.", error.message);
    return res.status(500).json({ error: "Failed to classify text." });
  }
});

// Protected route: /report-issue
protectedRoutes.post("/report-issue", async (req, res) => {
  const text = req.body?.text;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Please provide text as a string." });
  }

  try {
    const classification = await classifyText(text);

    const docRef = await db.collection("issues").add({
      text,
      category: classification.category,
      department: classification.department,
      priority: classification.priority,
      confidence: classification.confidence,
      userId: req.user.uid, // Track which user created the issue
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const snap = await docRef.get();
    return res.json({ id: docRef.id, ...snap.data() });
  } catch (error) {
    console.error("Failed to report issue:", error.message);
    return res.status(500).json({ error: "Failed to report issue." });
  }
});

// Mount protected routes
app.use('/api', protectedRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`AI server running on port ${port}`);
});
