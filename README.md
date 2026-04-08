# Crescendo26 - Pune Civic Issue Reporting App 🚧📱

A **no-login, AI-powered civic complaint platform** for Pune, fixing PMC portal flaws with token-based tracking, Instagram-style feeds, and citizen verification. Built for Crescendo26 hackathon.

## ✨ **Key Features**
- **AI Issue Detection**: Gemini auto-tags potholes/garbage from photos + description.
- **5-Tab UX**: Feed, Report, Cleared, My Tokens (browser PWA), Admin Panel.
- **Unique Hooks**: Upvote red-flags, public before/after galleries, browser tokens for private verification.
- **PWA Ready**: Web/mobile hybrid—no app download.
- **Admin Power**: Dashboards, heatmaps, bulk status, analytics.

## 🛠 **Tech Stack**
1. Frontend: React Native / Flutter (cross-platform mobile + PWA)
2. Backend: Node.js with Express / FastAPI (Python) for APIs
3. Database: Firebase Firestore (real-time) + PostGIS for geo-queries
4. AI/ML: Google Gemini API for photo categorization & description generation
5. Maps/Location: Google Maps API / Leaflet + OpenStreetMap for pinning & heatmaps
6. Auth/State: Browser localStorage + Crypto for unique complaint tokens
7. Real-time: Socket.io / Firebase Realtime DB for status updates & upvotes
8. Deployment: Vercel / Netlify (frontend PWA), Railway / Render (backend)
9. Analytics/Charts: Chart.js / Recharts for admin dashboards

Extras: PWA manifest for installability, Tailwind CSS for UI
## 🚀 **Quick Start**
```bash
git clone https://github.com/siddhipatil885/Crescendo26.git
cd Crescendo26
npm install  # or yarn install
cp .env.example .env  # Add Gemini/Maps keys
npm run dev
```

## 📱 **Tab Breakdown**
1. **Complaints Feed**: Map/reels with upvotes for priority.
2. **Report Issue**: Photo → AI → Token.
3. **Cleared Issues**: Before/after successes.
4. **My Tokens**: Private status/verification.
5. **Admin**: Stats, assign, analytics.

## 🎯 **Why Unique?**
- Token-gated privacy (no PMC mobile leaks).
- Viral reels + verification beats I Change My City.
- Contractor routing ready (PMC scrape mock).

## 🤝 **Contribute**
- Fork & PR for Pune expansions.
- Issues: Bug/feature requests welcome!

## 📄 **License**
MIT © Siddhi Patil [crescendo-hackathon.devfolio](https://crescendo-hackathon.devfolio.co)

**Built with ❤️ for Pune citizens. Star if helpful! ⭐**
