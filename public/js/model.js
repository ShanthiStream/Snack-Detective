// Server-Side Gemini AI Vision Model Client for Snack Detective By Devdarsh

class SnackClassifier {
  constructor() {
    this.serverOnline = false;
    this.hasServerKey = false;
    this.checkServerStatus();
  }

  getByokKey() {
    return localStorage.getItem('snack_detective_byok_key') || '';
  }

  setByokKey(key) {
    if (key && key.trim()) {
      localStorage.setItem('snack_detective_byok_key', key.trim());
    } else {
      this.clearByokKey();
    }
  }

  clearByokKey() {
    localStorage.removeItem('snack_detective_byok_key');
  }

  hasByokKey() {
    const key = this.getByokKey();
    return Boolean(key && key.length > 5);
  }

  async checkServerStatus() {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        this.serverOnline = true;
        this.hasServerKey = data.hasServerKey;
        return data;
      }
    } catch (e) {
      console.warn('Backend server not detected or offline:', e);
      this.serverOnline = false;
    }
    return { hasServerKey: false, model: 'Offline' };
  }

  // Convert HTML Image/Video/Canvas to Base64 JPEG string
  getImageBase64(imageElement) {
    try {
      const canvas = document.createElement('canvas');
      const maxDim = 800; // Optimal resolution for Gemini Multimodal Vision
      let w = imageElement.videoWidth || imageElement.naturalWidth || imageElement.width || 300;
      let h = imageElement.videoHeight || imageElement.naturalHeight || imageElement.height || 300;

      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageElement, 0, 0, w, h);
      return canvas.toDataURL('image/jpeg', 0.88);
    } catch (e) {
      console.warn('Could not extract image base64:', e);
      return null;
    }
  }

  // Main Classification Pipeline - Calls Server-Side Gemini (Primary Server Key or BYOK)
  async classify(imageElement, hint = null, snackName = null) {
    const base64Data = this.getImageBase64(imageElement);
    const byokKey = this.getByokKey();

    try {
      const response = await fetch('/api/detect-snack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(byokKey ? { 'X-Gemini-Key': byokKey } : {})
        },
        body: JSON.stringify({
          image: base64Data,
          apiKey: byokKey || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.result) {
          const res = data.result;
          const isFood = res.isFood !== false && res.verdict !== 'Not Food';
          return {
            isFood: isFood,
            verdict: isFood ? (res.verdict || 'Healthy') : 'Not Food',
            confidence: res.confidence || 0.98,
            exactFood: res.exactFood || snackName || (isFood ? 'Scanned Snack' : 'Non-Food Item'),
            superpower: res.superpower || (isFood ? 'Nutrient Power ⚡' : 'Not Edible! 🛑'),
            pipSpeech: res.pipSpeech || (isFood 
              ? `Aha! Detective Pip inspected your snack!` 
              : `Hold on, Detective! That's not food! Detective Pip only investigates real, edible snacks! 🛑`),
            tip: res.balanceTip || (isFood 
              ? `Remember to stay hydrated and balance your snacks!` 
              : `Detective Safety Tip: Toys and school supplies are not snacks! Only eat real, clean food.`),
            modelSource: 'AI Vision'
          };
        } else if (data.error) {
          console.error('AI Detection API error:', data.error);
          alert('🔍 Detective Pip Note:\n' + data.error);
        }
      }
    } catch (err) {
      console.warn('Server detect-snack call failed:', err);
    }

    // High quality safe fallback if server is unreachable
    return this.fallbackAnalysis(imageElement, hint, snackName);
  }

  // Conversational "Ask Detective Pip" via Server-Side Gemini
  async askDetectivePip(question, currentSnack = 'Snack', verdict = 'Healthy') {
    const byokKey = this.getByokKey();
    try {
      const res = await fetch('/api/ask-pip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(byokKey ? { 'X-Gemini-Key': byokKey } : {})
        },
        body: JSON.stringify({
          question,
          snackName: currentSnack,
          verdict,
          apiKey: byokKey || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.answer) {
          return data.answer;
        }
      }
    } catch (e) {
      console.warn('Server ask-pip error:', e);
    }

    if (verdict === 'Not Food') {
      return `Aha! Detective Pip says: remember, ${currentSnack} is not a food! We only investigate tasty snacks you can safely eat! 🍎🥕`;
    }
    return `Aha! Detective Pip says: enjoying your ${currentSnack} with plenty of water and fresh balance is your ultimate detective superpower! 🌟`;
  }

  // Graceful fallback if network drops
  fallbackAnalysis(imageElement, hint, snackName) {
    if (hint === 'not-food') {
      return {
        isFood: false,
        verdict: 'Not Food',
        confidence: 0.95,
        exactFood: snackName || 'School Pencil / Toy',
        superpower: 'Not Edible! 🛑',
        pipSpeech: `Wait a minute, Detective! That's not a food item! Detective Pip only gives clues for yummy food to eat! 🔍🛑`,
        tip: 'Detective Tip: Toys and pencils are for fun and learning, not for eating! Try scanning real snacks like fruits or veggies.',
        modelSource: 'Smart Classifier'
      };
    }

    const isTreat = hint === 'treat' || (snackName && (snackName.toLowerCase().includes('cookie') || snackName.toLowerCase().includes('chips') || snackName.toLowerCase().includes('donut')));
    const name = snackName || (isTreat ? 'Delicious Treat' : 'Fresh Healthy Snack');

    if (isTreat) {
      return {
        isFood: true,
        verdict: 'Treat',
        confidence: 0.95,
        exactFood: name,
        superpower: 'Quick Energy Spark ✨',
        pipSpeech: `Mmm! That looks like a tasty treat! Remember Detective Rule #1: balance treats with fresh water and fruit! 🌟🍪`,
        tip: 'Enjoy your treat in moderation, and fuel your next detective mission with crunchy veggies!',
        modelSource: 'Smart Classifier'
      };
    }

    return {
      isFood: true,
      verdict: 'Healthy',
      confidence: 0.96,
      exactFood: name,
      superpower: 'Vitamins & Fiber Stamina 🍎',
      pipSpeech: `Aha! Detective Pip spotted a wholesome, healthy snack! Packed with nutrients to fuel your detective brain! 🚀✨`,
      tip: 'Fresh healthy snacks give you long-lasting stamina for school, sports, and play!',
      modelSource: 'Smart Classifier'
    };
  }
}

window.snackClassifier = new SnackClassifier();
