# 🔍 Snack Detective AI By Devdarsh — Kid-Friendly AI Food Sleuth 🥕🍪

**Snack Detective AI By Devdarsh** is a vibrant, multi-platform web app created by Devdarsh (Grade 3, Bahrain Indian School). Kids can point their camera at any snack or upload a photo, and the AI classifies it as **"Super Healthy 🥕"** or a **"Yummy Treat 🍪"**, identifying the exact food, its nutrient superpower, and custom encouraging dialogue spoken aloud by Detective Pip! Non-food items (like stationery, toys, gadgets) are detected with fun safety reminders without snack suggestions.

---

## 🌟 Key Features

### 🦊 1. Cheerful Detective Mascot ("Detective Pip")
- An animated cartoon fox detective welcomes young learners with speech bubbles and vocal encouragement.
- Includes a **Speech Synthesis engine ("Detective Voice")** so Pip can speak verdicts and tips out loud!

### 📸 2. Multi-Mode Scanner & Instant Demo Tray
- **Live Device Camera**: Works smoothly across mobile phones, tablets (iPads, Android), and laptops with front/back camera switching.
- **Photo Upload**: Drag-and-drop or select pictures directly from your device.
- **Magnifying Glass Scanning Animation**: A sweeping detective laser and magnifying lens with radar audio feedback.
- **Instant Demo Snacks Tray**: 6 preloaded snacks (Crisp Apple & Carrots, Chocolate Cookie, Banana, Potato Chips, Broccoli, Glazed Donut) for instant testing without needing real food on hand!

### 🥕🍪 3. Positive & Encouraging Verdict System
- **Super Healthy 🥕**: Emerald green checkmark, confetti explosion, and celebratory fanfare.
- **Yummy Treat 🍪**: Warm golden cookie stamp, cheerful marimba chime, and an encouraging message that never shames treats (*"Yummy treat! Remember to balance it with fresh water or fruit!"*).
- **Exact Food Identification**: Accurately recognizes whether an item is an Apple, Banana, Carrot, Chocolate Chip Cookie, Donut, etc.
- **Superpower Nutrient**: Highlights a kid-friendly nutrient shield (e.g. *Vitamin C & Pectin Fiber Shield 🍎*).
- **AI Confidence Meter**: Visual meter displaying model certainty.

### 🎖️ 4. Gamified Streak & Badge System
- **Detective Badges**:
  - 🔍 *First Case Solved* (First snack investigated)
  - 🥕 *Veggie Hero* (Scan 3 healthy snacks)
  - 🍎 *Fruit Star* (Scan 5 healthy snacks)
  - ⚖️ *Balanced Sleuth* (Investigate both a healthy snack and a treat)
  - 🔥 *Streak Sleuth* (3 healthy choices in a row)
  - 🌈 *Rainbow Detective* (8 total snacks investigated)
  - 🏆 *Chief Detective* (15 total snack mysteries solved)
- **Local Persistence**: Progress, stars, and streaks are safely stored in `localStorage`.

### 🔊 5. Zero-Dependency Web Audio Synthesizer
- Uses the browser's native **Web Audio API** to synthesize pops, radar sweeps, fanfares, and chimes.
- Works 100% offline with zero external audio file dependencies!

### 🤖 6. Google Gemini Multimodal Vision AI (Primary Server Key + BYOK)
- **Primary Server-Side Key**: Configured in `.env` on the server so kids can instantly scan without any complex setup.
- **BYOK (Bring Your Own Key)**: Kids, teachers, and judges can optionally enter their personal Gemini API key in **Settings (⚙️)**.
- **💬 Interactive "Ask Detective Pip" Drawer**: Kids can tap question chips (*"Why is it healthy? 🧐"*, *"Can I eat this before sports? 🏃"*, *"What should I pair with this? 🥛"*) or type custom questions to get real-time answers spoken aloud by Pip!

---

## 🚀 How to Run Locally

### 1. Configure Your Gemini API Key
Create a `.env` file in the root directory (copied from `.env.example`):
```bash
cp .env.example .env
```
Open `.env` and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8080
```

### 2. Start the Server
```bash
npm start
# or: node server.js
```

### 3. Open in Browser
Open [http://localhost:8080](http://localhost:8080) on your computer, tablet, or phone!

---

## 📄 License & Attribution
Created with 💛 for young AI explorers by **Devdarsh, Grade 3, Bahrain Indian School**.
