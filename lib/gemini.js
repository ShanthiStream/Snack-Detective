// Gemini Multimodal Vision helper for Snack Detective By Devdarsh
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(process.cwd(), '.env');

function getServerApiKey() {
  // 1. First check process.env (Vercel environment variables or pre-set)
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5) {
    return process.env.GEMINI_API_KEY.trim();
  }

  // 2. Fallback to local .env file if it exists
  if (fs.existsSync(ENV_FILE)) {
    try {
      const content = fs.readFileSync(ENV_FILE, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...vals] = trimmed.split('=');
          if (key.trim() === 'GEMINI_API_KEY') {
            const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
            if (val) return val;
          }
        }
      }
    } catch (e) {
      console.warn('Could not read .env file:', e.message);
    }
  }

  return '';
}

function getEffectiveApiKey(clientKey) {
  if (clientKey && typeof clientKey === 'string' && clientKey.trim().length > 5) {
    return clientKey.trim();
  }
  return getServerApiKey();
}

const VISION_MODELS = ['gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview'];

async function callGeminiVision(base64Image, clientKey = null) {
  const apiKey = getEffectiveApiKey(clientKey);
  if (!apiKey) {
    throw new Error('No Gemini API key found! Please configure GEMINI_API_KEY in Vercel Environment Variables, in local .env, or use BYOK in Settings (⚙️).');
  }

  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const prompt = `
You are Detective Pip, a friendly cartoon fox detective for kids aged 8-11 in a school AI project called "Snack Detective AI By Devdarsh".
Look at this image carefully.

STEP 1: DETERMINE IF THE ITEM IS AN EDIBLE FOOD, DRINK, OR SNACK
- First, check if the main object shown in the image is edible food, a snack, or a drink.
- If it is a NON-FOOD item (such as a pencil, pen, paper, notebook, book, shoe, clothes, toy, electronic device, phone, laptop, keyboard, furniture, toy car, household item, tool, animal, pet, human body part with no food, etc.):
  You MUST return this exact JSON structure:
  {
    "isFood": false,
    "verdict": "Not Food",
    "exactFood": "Name of the object identified (e.g. Wooden Pencil, Sneaker Shoe, Toy Car)",
    "confidence": 0.98,
    "superpower": "Not Edible! 🛑",
    "pipSpeech": "Hold on, Detective! That's not food — that looks like a [item name]! Detective Pip only investigates real, edible snacks. We can't eat that! Try scanning some yummy food! 🍎🥨",
    "balanceTip": "Detective Safety Rule: Objects like pencils, toys, and gadgets are for school and play, not for eating! Always pick clean, healthy food for your tummy."
  }
  CRITICAL: Do NOT give any snack nutritional advice, snack suggestions, or classify non-food items as Healthy or Treat!

STEP 2: IF AND ONLY IF IT IS EDIBLE FOOD OR DRINK:
- Identify EXACTLY what food is shown in this image.
  - If it is an apple, call it an Apple (or specific variety like Crisp Red Apple, Tart Green Apple).
  - If it is a banana, carrot, cookie, chips, donut, sandwich, broccoli, yogurt, etc., name it accurately.
  - DO NOT confuse fruits or snacks with each other. Look closely at colors, shapes, and textures.
- Classify whether this is a "Healthy" snack or a "Treat":
  - Healthy: fruits, vegetables, yogurt, nuts, seeds, whole grains, milk, water.
  - Treat: cookies, cakes, potato chips, candy, donuts, sodas, sugary processed snacks.
- Return this exact JSON structure:
  {
    "isFood": true,
    "verdict": "Healthy" or "Treat",
    "exactFood": "Name of the exact food identified (e.g. Crisp Red Apple)",
    "confidence": 0.98,
    "superpower": "Short 3-5 word kid-friendly energy superpower (e.g. Vitamin C & Pectin Fiber Shield 🍎)",
    "pipSpeech": "1-2 friendly, enthusiastic sentences spoken by Detective Pip describing what he sees and why it fuels the body. Always encouraging, never shaming treats. NEVER mention servers, backend, APIs, AI models, prompts, or technical jargon.",
    "balanceTip": "A fun detective tip on how this food helps the body or how to enjoy it in healthy balance."
  }

Return ONLY valid JSON (no markdown formatting fences, no backticks, no extra text).
`.trim();

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: cleanBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 600
    }
  };

  let lastError = null;

  for (const modelName of VISION_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Model ${modelName} returned status ${response.status}: ${errText.substring(0, 150)}`);
        lastError = new Error(`Gemini API Error (${response.status}): ${errText}`);
        if (response.status === 503 || response.status === 404 || response.status === 429) {
          continue;
        } else {
          throw lastError;
        }
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No response text generated by Gemini model.');

      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        return JSON.parse(cleanedText.substring(firstBrace, lastBrace + 1));
      }
      return JSON.parse(cleanedText);
    } catch (err) {
      lastError = err;
      console.warn(`Attempt with ${modelName} failed: ${err.message}`);
    }
  }

  throw lastError || new Error('All vision models failed to respond.');
}

async function callGeminiPipChat(question, snackName, verdict, clientKey = null) {
  const apiKey = getEffectiveApiKey(clientKey);
  const isNotFood = verdict === 'Not Food';

  if (!apiKey) {
    if (isNotFood) {
      return `Detective Pip says: ${snackName} is for play or schoolwork, not for eating! Let's find a yummy snack like fruit or veggies to investigate! 🔍🍎`;
    }
    return `Aha! Detective Pip says: enjoying your ${snackName} with plenty of fresh water and balance is your true detective superpower! 🌟`;
  }

  const prompt = `
You are Detective Pip, a cheerful cartoon fox detective helping kids aged 8-11 in a school AI project called "Snack Detective AI By Devdarsh".
The item scanned was: "${snackName}" (Verdict: "${verdict}").
The child asks:
"${question}"

RULES:
1. If the item is "Not Food":
   Remind the child in a friendly, cheerful way that ${snackName} is not a food and should never be eaten! Do NOT provide any snack suggestion or recipe for it. Encourage them to scan an edible snack instead like an apple, carrot, or treat.
2. If the item is food:
   Answer in 1-2 friendly, energetic, kid-friendly sentences in character. Be encouraging, helpful, and never make them feel bad about treats.
3. NEVER mention AI models, servers, APIs, coding, training data, or technical jargon. Speak strictly as Detective Pip, a cartoon fox detective for kids!
`.trim();

  for (const modelName of VISION_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 250 }
        })
      });

      if (response.ok) {
        const json = await response.json();
        const reply = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply.trim();
      }
    } catch (e) {
      console.warn(`PipChat with ${modelName} failed:`, e.message);
    }
  }

  return `Aha! Detective Pip says: enjoying your ${snackName} with good balance and plenty of water is pure detective brilliance! 🌟`;
}

module.exports = {
  getServerApiKey,
  getEffectiveApiKey,
  callGeminiVision,
  callGeminiPipChat
};
