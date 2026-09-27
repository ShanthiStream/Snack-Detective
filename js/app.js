// Main Application Controller for Snack Detective

class SnackDetectiveApp {
  constructor() {
    this.currentScreen = 'home';
    this.videoStream = null;
    this.facingMode = 'environment'; // default to back camera for phone/tablet
    this.currentCaptureDataUrl = null;
    this.activeSampleHint = null;

    // Sample food visuals (SVG Data URIs for instant demo testing)
    this.DEMO_SAMPLES = {
      apple_carrots: {
        src: 'assets/sample_healthy.jpg',
        name: 'Crisp Apple & Baby Carrots',
        type: 'healthy'
      },
      cookie: {
        src: 'assets/sample_treat.jpg',
        name: 'Warm Chocolate Chip Cookie',
        type: 'treat'
      },
      banana: {
        src: this.createFoodSvgDataUri('🍌', '#FFF3B0', '#F4D03F'),
        name: 'Fresh Golden Banana',
        type: 'healthy'
      },
      chips: {
        src: this.createFoodSvgDataUri('🍟', '#FFE0B2', '#FF9800'),
        name: 'Crispy Potato Chips',
        type: 'treat'
      },
      broccoli: {
        src: this.createFoodSvgDataUri('🥦', '#C8E6C9', '#4CAF50'),
        name: 'Crunchy Green Broccoli',
        type: 'healthy'
      },
      donut: {
        src: this.createFoodSvgDataUri('🍩', '#F8BBD0', '#E91E63'),
        name: 'Glazed Frosted Donut',
        type: 'treat'
      },
      pencil: {
        src: this.createFoodSvgDataUri('✏️', '#E2E8F0', '#64748B'),
        name: 'School Pencil',
        type: 'not-food'
      }
    };

    this.initElements();
    this.bindEvents();
    this.updateStatsDisplay();
  }

  createFoodSvgDataUri(emoji, bgColor, borderColor) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <rect width="300" height="300" fill="${bgColor}" rx="40"/>
        <circle cx="150" cy="150" r="110" fill="#FFFFFF" stroke="${borderColor}" stroke-width="8"/>
        <text x="50%" y="54%" font-size="120" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
      </svg>
    `.trim();
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  initElements() {
    // Navigation & Toggles
    this.navLogo = document.getElementById('nav-logo');
    this.btnSoundToggle = document.getElementById('btn-sound-toggle');
    this.btnVoiceToggle = document.getElementById('btn-voice-toggle');
    this.btnSettingsOpen = document.getElementById('btn-settings-open');
    this.starCountDisplay = document.getElementById('star-count-display');

    // Screens
    this.screenHome = document.getElementById('screen-home');
    this.screenScanner = document.getElementById('screen-scanner');
    this.screenResult = document.getElementById('screen-result');
    this.screenBadges = document.getElementById('screen-badges');
    this.screenLogbook = document.getElementById('screen-logbook');

    // Home elements
    this.btnStartScanning = document.getElementById('btn-start-scanning');
    this.shortcutBadges = document.getElementById('shortcut-badges');
    this.shortcutLogbook = document.getElementById('shortcut-logbook');
    this.shortcutDemos = document.getElementById('shortcut-demos');
    this.shortcutModel = document.getElementById('shortcut-model');
    this.homeBadgeSummary = document.getElementById('home-badge-summary');
    this.homeLogbookSummary = document.getElementById('home-logbook-summary');
    this.homeModelSummary = document.getElementById('home-model-summary');

    // Scanner elements
    this.cameraVideo = document.getElementById('camera-video');
    this.previewImage = document.getElementById('preview-image');
    this.btnCameraFlip = document.getElementById('btn-camera-flip');
    this.btnBackFromScanner = document.getElementById('btn-back-from-scanner');
    this.btnUploadPhoto = document.getElementById('btn-upload-photo');
    this.fileInput = document.getElementById('file-input');
    this.btnCaptureShutter = document.getElementById('btn-shutter');
    this.btnCaptureShutterAlt = document.getElementById('btn-capture-shutter');
    this.scanningOverlay = document.getElementById('scanning-overlay');
    this.scanningStatusText = document.getElementById('scanning-status-text');
    this.btnQuickSamplesToggle = document.getElementById('btn-quick-samples-toggle');
    this.demoSnackTray = document.getElementById('demo-snack-tray');

    // Result elements
    this.resultCardBox = document.getElementById('result-card-box');
    this.resultVerdictStamp = document.getElementById('result-verdict-stamp');
    this.verdictIcon = document.getElementById('verdict-icon');
    this.verdictText = document.getElementById('verdict-text');
    this.exactFoodTitle = document.getElementById('exact-food-title');
    this.superpowerText = document.getElementById('superpower-text');
    this.resultSnackImg = document.getElementById('result-snack-img');
    this.resultPipSpeech = document.getElementById('result-pip-speech');
    this.confidencePercentageLabel = document.getElementById('confidence-percentage-label');
    this.confidenceBarFill = document.getElementById('confidence-bar-fill');
    this.nutritionClueTitle = document.getElementById('nutrition-clue-title');
    this.nutritionClueText = document.getElementById('nutrition-clue-text');
    this.btnScanAgain = document.getElementById('btn-scan-again');
    this.btnViewBadgesFromResult = document.getElementById('btn-view-badges-from-result');
    this.btnHomeFromResult = document.getElementById('btn-home-from-result');

    // Ask Pip Interactive Drawer
    this.askPipChips = document.getElementById('ask-pip-chips');
    this.pipCustomQuestion = document.getElementById('pip-custom-question');
    this.btnPipAskSend = document.getElementById('btn-pip-ask-send');
    this.pipAnswerDisplay = document.getElementById('pip-answer-display');
    this.pipAnswerText = document.getElementById('pip-answer-text');

    // Badges elements
    this.btnBackFromBadges = document.getElementById('btn-back-from-badges');
    this.badgeStatStars = document.getElementById('badge-stat-stars');
    this.badgeStatStreak = document.getElementById('badge-stat-streak');
    this.badgeStatUnlocked = document.getElementById('badge-stat-unlocked');
    this.badgesGridContainer = document.getElementById('badges-grid-container');

    // Logbook elements
    this.btnBackFromLogbook = document.getElementById('btn-back-from-logbook');
    this.btnClearLogbook = document.getElementById('btn-clear-logbook');
    this.logbookListContainer = document.getElementById('logbook-list-container');

    // Settings modal & Primary Server / BYOK Gemini setup
    this.modalSettings = document.getElementById('modal-settings');
    this.btnSettingsClose = document.getElementById('btn-settings-close');
    this.modelStatusDot = document.getElementById('model-status-dot');
    this.modelStatusText = document.getElementById('model-status-text');
    this.serverKeyBadge = document.getElementById('server-key-badge');
    this.byokStatusBadge = document.getElementById('byok-status-badge');
    this.byokApiKeyInput = document.getElementById('byok-api-key');
    this.btnSaveByokKey = document.getElementById('btn-save-byok-key');
    this.btnClearByokKey = document.getElementById('btn-clear-byok-key');
  }

  bindEvents() {
    // Navigation
    this.navLogo.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.showScreen('home');
    });

    this.btnSoundToggle.addEventListener('click', () => {
      const enabled = window.detectiveAudio.toggleSound();
      this.btnSoundToggle.textContent = enabled ? '🔊' : '🔇';
      if (enabled) window.detectiveAudio.playPop();
    });

    this.btnVoiceToggle.addEventListener('click', () => {
      const enabled = window.detectiveAudio.toggleVoice();
      this.btnVoiceToggle.textContent = enabled ? '🗣️' : '🤫';
      if (enabled) {
        window.detectiveAudio.playPop();
        window.detectiveAudio.speak('Detective voice is on! Pip is ready!');
      }
    });

    this.btnSettingsOpen.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.openSettingsModal();
    });

    this.btnSettingsClose.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.closeSettingsModal();
    });

    // Home buttons
    this.btnStartScanning.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.showScreen('scanner');
    });

    this.shortcutBadges.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.showScreen('badges');
    });

    this.shortcutLogbook.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.showScreen('logbook');
    });

    this.shortcutDemos.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.showScreen('scanner');
      this.demoSnackTray.scrollIntoView({ behavior: 'smooth' });
    });

    this.shortcutModel.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.openSettingsModal();
    });

    // Scanner actions
    this.btnBackFromScanner.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.stopCamera();
      this.showScreen('home');
    });

    this.btnCameraFlip.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.flipCamera();
    });

    const shutterBtn = this.btnCaptureShutterAlt || this.btnCaptureShutter;
    if (shutterBtn) {
      shutterBtn.addEventListener('click', () => {
        window.detectiveAudio.playPop();
        this.captureAndScanLiveVideo();
      });
    }

    this.btnUploadPhoto.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', (e) => {
      this.handleFileSelected(e);
    });

    this.btnQuickSamplesToggle.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.demoSnackTray.scrollIntoView({ behavior: 'smooth' });
    });

    // Sample food chip buttons
    document.querySelectorAll('.snack-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.detectiveAudio.playPop();
        const sampleKey = btn.dataset.sample;
        const sampleData = this.DEMO_SAMPLES[sampleKey];
        if (sampleData) {
          this.testSampleSnack(sampleData);
        }
      });
    });

    // Result buttons
    this.btnScanAgain.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.showScreen('scanner');
    });

    this.btnViewBadgesFromResult.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.showScreen('badges');
    });

    this.btnHomeFromResult.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.showScreen('home');
    });

    // Badges actions
    this.btnBackFromBadges.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.showScreen('home');
    });

    // Logbook actions
    this.btnBackFromLogbook.addEventListener('click', () => {
      window.detectiveAudio.playPop();
      this.showScreen('home');
    });

    this.btnClearLogbook.addEventListener('click', () => {
      if (confirm('Clear your detective logbook? Your badges and stars will be kept safe!')) {
        window.detectiveAudio.playPop();
        window.detectiveStorage.clearHistory();
        this.renderLogbook();
        this.updateStatsDisplay();
      }
    });

    // Ask Detective Pip Drawer events
    document.querySelectorAll('.pip-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.dataset.q || btn.textContent;
        this.handleAskPip(question);
      });
    });

    if (this.btnPipAskSend) {
      this.btnPipAskSend.addEventListener('click', () => {
        const q = this.pipCustomQuestion.value.trim();
        if (q) this.handleAskPip(q);
      });
    }

    if (this.pipCustomQuestion) {
      this.pipCustomQuestion.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = this.pipCustomQuestion.value.trim();
          if (q) this.handleAskPip(q);
        }
      });
    }

    // BYOK (Bring Your Own Key) Save button
    if (this.btnSaveByokKey) {
      this.btnSaveByokKey.addEventListener('click', () => {
        const key = this.byokApiKeyInput.value.trim();
        if (!key) {
          alert('Please enter your personal Gemini API key or click "Use Server Key".');
          return;
        }
        window.snackClassifier.setByokKey(key);
        window.detectiveAudio.playBadgeUnlock();
        this.updateModelStatusDisplay();
        alert('🎉 Personal Gemini API Key (BYOK) saved in your browser! The app will use your key for scans.');
        this.closeSettingsModal();
      });
    }

    // BYOK Clear (Revert to Primary Server Key)
    if (this.btnClearByokKey) {
      this.btnClearByokKey.addEventListener('click', () => {
        window.snackClassifier.clearByokKey();
        this.byokApiKeyInput.value = '';
        window.detectiveAudio.playPop();
        this.updateModelStatusDisplay();
        alert('Reverted to Primary Server Key! 🚀');
      });
    }

    // Global audio unlock on first user gesture
    const unlockAudio = () => {
      window.detectiveAudio.resumeContext();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
  }

  showScreen(screenId) {
    // Hide all screens
    [
      this.screenHome,
      this.screenScanner,
      this.screenResult,
      this.screenBadges,
      this.screenLogbook
    ].forEach(screen => {
      if (screen) screen.classList.remove('active');
    });

    this.currentScreen = screenId;

    if (screenId === 'home') {
      this.stopCamera();
      this.screenHome.classList.add('active');
      this.updateStatsDisplay();
    } else if (screenId === 'scanner') {
      this.screenScanner.classList.add('active');
      this.startCamera();
    } else if (screenId === 'result') {
      this.stopCamera();
      this.screenResult.classList.add('active');
    } else if (screenId === 'badges') {
      this.stopCamera();
      this.screenBadges.classList.add('active');
      this.renderBadges();
    } else if (screenId === 'logbook') {
      this.stopCamera();
      this.screenLogbook.classList.add('active');
      this.renderLogbook();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // CAMERA MANAGEMENT
  async startCamera() {
    this.previewImage.style.display = 'none';
    this.cameraVideo.style.display = 'block';

    if (this.videoStream) {
      this.stopCamera();
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: this.facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.cameraVideo.srcObject = this.videoStream;
      await this.cameraVideo.play();
    } catch (err) {
      console.warn('Camera could not be accessed directly:', err);
      // If camera blocked or unavailable, display friendly helpful guidance and switch to demo preview
      this.cameraVideo.style.display = 'none';
      this.previewImage.style.display = 'block';
      this.previewImage.src = this.DEMO_SAMPLES.apple_carrots.src;
      this.activeSampleHint = 'healthy';
      this.currentCaptureDataUrl = this.previewImage.src;
    }
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }

  flipCamera() {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    this.startCamera();
  }

  // Handle live photo snap from camera video
  captureAndScanLiveVideo() {
    if (!this.cameraVideo || this.cameraVideo.videoWidth === 0) {
      // If camera is not active, scan whatever preview image is loaded
      if (this.previewImage.src) {
        this.runScanProcess(this.previewImage, this.activeSampleHint, 'Scanned Snack');
      } else {
        alert('Please allow camera access or choose a sample snack below! 🍎');
      }
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = this.cameraVideo.videoWidth;
    canvas.height = this.cameraVideo.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.cameraVideo, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    this.currentCaptureDataUrl = dataUrl;

    // Show captured image on preview
    this.cameraVideo.style.display = 'none';
    this.previewImage.style.display = 'block';
    this.previewImage.src = dataUrl;

    this.runScanProcess(this.previewImage, null, 'Detective Photo');
  }

  // Handle file picker selection
  handleFileSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.stopCamera();
      this.cameraVideo.style.display = 'none';
      this.previewImage.style.display = 'block';
      this.previewImage.src = e.target.result;
      this.currentCaptureDataUrl = e.target.result;
      this.activeSampleHint = null;

      this.runScanProcess(this.previewImage, null, file.name.split('.')[0] || 'Uploaded Snack');
    };
    reader.readAsDataURL(file);
  }

  // Test an instant sample snack card
  testSampleSnack(sample) {
    this.stopCamera();
    this.cameraVideo.style.display = 'none';
    this.previewImage.style.display = 'block';
    this.previewImage.src = sample.src;
    this.currentCaptureDataUrl = sample.src;
    this.activeSampleHint = sample.type;

    this.runScanProcess(this.previewImage, sample.type, sample.name);
  }

  // Run the full detective scanning sequence
  async runScanProcess(imageElement, hint = null, snackName = 'Delicious Snack') {
    const photoUrl = this.currentCaptureDataUrl || (imageElement ? imageElement.src : null) || 'assets/sample_healthy.jpg';
    this.currentCaptureDataUrl = photoUrl;

    // 1. Show scanning overlay
    this.scanningOverlay.classList.add('active');
    this.scanningStatusText.textContent = 'Pip is inspecting the clues with AI Vision...';

    // 2. Play scanning sound
    window.detectiveAudio.playScan();

    // 3. Anticipation delay for kids (1s)
    await new Promise(r => setTimeout(r, 1000));

    // 4. Run classification
    const result = await window.snackClassifier.classify(imageElement, hint, snackName);

    // 5. Hide scanning overlay
    this.scanningOverlay.classList.remove('active');

    // 6. Record to storage if and only if it is real edible food
    let outcome = { stats: window.detectiveStorage.getStats(), newlyUnlockedBadges: [] };
    if (result.isFood !== false && result.verdict !== 'Not Food') {
      outcome = window.detectiveStorage.addScanRecord({
        verdict: result.verdict,
        confidence: result.confidence,
        snackName: result.exactFood || snackName,
        thumbnail: photoUrl,
        tip: result.tip
      });
    }

    // 7. Dispatch Vercel Analytics event
    if (window.va) {
      window.va('event', {
        name: 'snack_scan',
        verdict: result.verdict,
        food: result.exactFood || snackName,
        isFood: result.isFood !== false && result.verdict !== 'Not Food'
      });
    }

    // 8. Display Result Screen with photoUrl guaranteed
    this.renderResultScreen(result, outcome, snackName, photoUrl);
  }

  renderResultScreen(result, outcome, snackName, photoUrl = null) {
    const isNotFood = result.isFood === false || result.verdict === 'Not Food';
    const isHealthy = !isNotFood && result.verdict === 'Healthy';
    const percent = Math.round(result.confidence * 100);

    // Update Result Card Theme & Verdict Stamp
    if (isNotFood) {
      this.resultCardBox.className = 'fun-card result-card verdict-not-food';
      this.verdictIcon.textContent = '🛑';
      this.verdictText.textContent = 'NOT A FOOD!';
    } else if (isHealthy) {
      this.resultCardBox.className = 'fun-card result-card verdict-healthy';
      this.verdictIcon.textContent = '🥕';
      this.verdictText.textContent = 'SUPER HEALTHY!';
    } else {
      this.resultCardBox.className = 'fun-card result-card verdict-treat';
      this.verdictIcon.textContent = '🍪';
      this.verdictText.textContent = 'YUMMY TREAT!';
    }

    // Display the captured snack photo
    const finalPhoto = photoUrl || this.currentCaptureDataUrl || 'assets/sample_healthy.jpg';
    if (this.resultSnackImg) {
      this.resultSnackImg.src = finalPhoto;
      this.resultSnackImg.style.display = 'block';
    }

    // Set current active item for Pip chat
    this.currentSnackName = result.exactFood || snackName;
    this.currentVerdict = result.verdict;

    // Exact Food / Item Name
    if (this.exactFoodTitle) {
      this.exactFoodTitle.textContent = this.currentSnackName;
    }

    // Superpower Badge (or Not Edible warning)
    if (this.superpowerText) {
      if (isNotFood) {
        this.superpowerText.textContent = result.superpower || 'Item is Not Edible! 🛑';
      } else {
        this.superpowerText.textContent = result.superpower || (isHealthy ? 'Superpower: Vitamin & Fiber Shield ⚡' : 'Superpower: Quick Energy Spark ✨');
      }
    }

    // Reset Ask Pip Drawer
    if (this.pipAnswerDisplay) {
      this.pipAnswerDisplay.style.display = 'none';
    }
    if (this.pipCustomQuestion) {
      this.pipCustomQuestion.value = '';
      this.pipCustomQuestion.placeholder = isNotFood 
        ? `Ask Pip why this isn't food...` 
        : `Ask Pip a question about this snack...`;
    }

    // Update Ask Pip question chips dynamically
    if (this.askPipChips) {
      if (isNotFood) {
        this.askPipChips.innerHTML = `
          <button class="pip-chip-btn" data-q="Can I eat this item?">Can I eat this? 🤔</button>
          <button class="pip-chip-btn" data-q="Why is this not a snack?">Why not a snack? 🛑</button>
          <button class="pip-chip-btn" data-q="What healthy snack should I eat instead?">What snack instead? 🍎</button>
        `;
      } else {
        this.askPipChips.innerHTML = `
          <button class="pip-chip-btn" data-q="Why is this snack good for my body?">Why is it healthy? 🧐</button>
          <button class="pip-chip-btn" data-q="Can I eat this before playing sports?">Before sports? 🏃</button>
          <button class="pip-chip-btn" data-q="What should I pair with this snack?">What to pair with? 🥛</button>
        `;
      }
      this.askPipChips.querySelectorAll('.pip-chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.handleAskPip(btn.dataset.q);
        });
      });
    }

    // Pip Reaction Speech & Audio
    let speechHtml = result.pipSpeech;
    if (!speechHtml) {
      if (isNotFood) {
        speechHtml = `<strong>Hold on, Detective!</strong> That's not food — that looks like <em>${this.currentSnackName}</em>! Detective Pip only investigates real snacks to eat! 🛑🔍`;
      } else if (isHealthy) {
        speechHtml = `<strong>Aha!</strong> Super choice, Detective! This <em>${this.currentSnackName}</em> is packed with fresh nutrients to fuel your brain! 🚀✨`;
      } else {
        speechHtml = `<strong>Mmm, delicious!</strong> Treats like <em>${this.currentSnackName}</em> are super yummy fun! Remember the Detective Rule: balance it with some fresh water or fruit later! 🌟🍪`;
      }
    }

    this.resultPipSpeech.innerHTML = speechHtml;

    if (isNotFood) {
      window.detectiveAudio.playOopsSound();
    } else if (isHealthy) {
      window.detectiveAudio.playHealthyFanfare();
      window.confettiCannon.fire(80);
    } else {
      window.detectiveAudio.playTreatChime();
    }

    // Read speech aloud
    const spokenText = speechHtml.replace(/<[^>]*>?/gm, '');
    window.detectiveAudio.speak(spokenText);

    // Confidence - strictly kid-friendly, no technical jargon or server mentions
    this.confidencePercentageLabel.textContent = `${percent}% Sure`;
    this.confidenceBarFill.style.width = `${percent}%`;

    // Clue / Tip Card
    if (this.nutritionClueTitle) {
      this.nutritionClueTitle.textContent = isNotFood ? 'Detective Safety Tip' : 'Detective Clue of the Day';
    }
    this.nutritionClueText.textContent = result.tip || (isNotFood 
      ? 'Detective Tip: Objects and toys are not for eating! Try scanning real snacks like fruits or veggies.' 
      : 'Remember to stay hydrated and balance your snacks!');

    // Newly unlocked badges fanfare!
    if (outcome.newlyUnlockedBadges && outcome.newlyUnlockedBadges.length > 0) {
      setTimeout(() => {
        window.detectiveAudio.playBadgeUnlock();
        window.confettiCannon.fire(100);
        const b = outcome.newlyUnlockedBadges[0];
        alert(`🎖️ NEW DETECTIVE BADGE UNLOCKED!\n\n${b.icon} ${b.title}\n"${b.desc}"`);
      }, 700);
    }

    this.showScreen('result');
  }

  // Handle asking questions to Detective Pip
  async handleAskPip(question) {
    if (!question || !question.trim()) return;
    window.detectiveAudio.playPop();

    if (this.pipAnswerDisplay) {
      this.pipAnswerDisplay.style.display = 'flex';
      this.pipAnswerText.textContent = 'Pip is examining the clues... 🔍';
    }

    try {
      const answer = await window.snackClassifier.askDetectivePip(
        question, 
        this.currentSnackName || 'Snack', 
        this.currentVerdict || 'Healthy'
      );
      if (this.pipAnswerText) {
        this.pipAnswerText.textContent = answer;
      }
      if (window.va) {
        window.va('event', { name: 'ask_pip', snack: this.currentSnackName || 'Snack' });
      }
      window.detectiveAudio.speak(answer);
    } catch (e) {
      const fallback = this.currentVerdict === 'Not Food'
        ? `Aha! Detective Pip says: remember that ${this.currentSnackName || 'this item'} is not food! We only eat healthy snacks and treats!`
        : 'Aha! Pip says: remember that balance is a detective\'s greatest superpower!';
      if (this.pipAnswerText) this.pipAnswerText.textContent = fallback;
      window.detectiveAudio.speak(fallback);
    }
  }

  // BADGES SCREEN RENDERING
  renderBadges() {
    const stats = window.detectiveStorage.getStats();
    const badges = window.detectiveStorage.getBadges();
    const unlockedCount = badges.filter(b => b.unlocked).length;

    this.badgeStatStars.textContent = stats.detectiveStars || 0;
    this.badgeStatStreak.textContent = stats.currentHealthyStreak || 0;
    this.badgeStatUnlocked.textContent = `${unlockedCount}/${badges.length}`;

    this.badgesGridContainer.innerHTML = '';

    badges.forEach(b => {
      const card = document.createElement('div');
      card.className = `badge-card ${b.unlocked ? 'unlocked' : 'locked'}`;

      const pct = Math.min(100, Math.round((b.current / b.target) * 100));

      card.innerHTML = `
        <div class="badge-icon-wrapper">
          <span>${b.icon}</span>
          <span class="badge-lock-tag">${b.unlocked ? '✓' : '🔒'}</span>
        </div>
        <div class="badge-title">${b.title}</div>
        <div class="badge-desc">${b.desc}</div>
        <div class="badge-progress-track">
          <div class="badge-progress-fill" style="width: ${pct}%"></div>
        </div>
        <div class="badge-progress-text">${b.unlocked ? 'Unlocked! ⭐' : `${b.current} / ${b.target}`}</div>
      `;

      card.addEventListener('click', () => {
        window.detectiveAudio.playPop();
        if (b.unlocked) {
          alert(`🎖️ ${b.title} (${b.icon})\n\n"${b.desc}"\n\nStatus: UNLOCKED! You are an amazing Detective!`);
        } else {
          alert(`🔒 ${b.title} (${b.icon})\n\nGoal: "${b.desc}"\n\nCurrent Progress: ${b.current} of ${b.target} completed.`);
        }
      });

      this.badgesGridContainer.appendChild(card);
    });
  }

  // LOGBOOK SCREEN RENDERING
  renderLogbook() {
    const history = window.detectiveStorage.getHistory();
    this.logbookListContainer.innerHTML = '';

    if (history.length === 0) {
      this.logbookListContainer.innerHTML = `
        <div class="fun-card empty-state">
          <div class="empty-icon">🕵️</div>
          <h3>No Cases in Logbook Yet!</h3>
          <p style="color: var(--color-ink-light); margin-top: 6px;">
            Tap "Start Scanning!" to investigate your first snack mystery!
          </p>
        </div>
      `;
      return;
    }

    history.forEach(item => {
      const isH = item.verdict === 'Healthy';
      const el = document.createElement('div');
      el.className = 'log-item-card';

      el.innerHTML = `
        <img src="${item.thumbnail || (isH ? 'assets/sample_healthy.jpg' : 'assets/sample_treat.jpg')}" alt="Snack" class="log-item-thumb">
        <div class="log-item-info">
          <div class="log-item-title">${item.snackName}</div>
          <div class="log-item-meta">${item.date} at ${item.timestamp} &bull; ${Math.round(item.confidence * 100)}% Confident</div>
        </div>
        <div class="log-item-badge ${isH ? 'healthy' : 'treat'}">
          ${isH ? '🥕 Healthy' : '🍪 Treat'}
        </div>
      `;

      this.logbookListContainer.appendChild(el);
    });
  }

  updateStatsDisplay() {
    const stats = window.detectiveStorage.getStats();
    const badges = window.detectiveStorage.getBadges();
    const history = window.detectiveStorage.getHistory();
    const unlocked = badges.filter(b => b.unlocked).length;

    if (this.starCountDisplay) this.starCountDisplay.textContent = stats.detectiveStars || 0;
    if (this.homeBadgeSummary) this.homeBadgeSummary.textContent = `${unlocked} / ${badges.length} Unlocked`;
    if (this.homeLogbookSummary) this.homeLogbookSummary.textContent = `${history.length} Cases Solved`;

    const hasByok = window.snackClassifier.hasByokKey();
    if (this.homeModelSummary) {
      this.homeModelSummary.textContent = 'AI Ready 🟢';
    }
  }

  // SETTINGS & SERVER GEMINI INTEGRATION
  async openSettingsModal() {
    await this.updateModelStatusDisplay();
    this.modalSettings.classList.add('active');
  }

  closeSettingsModal() {
    this.modalSettings.classList.remove('active');
    this.updateStatsDisplay();
  }

  async updateModelStatusDisplay() {
    const status = await window.snackClassifier.checkServerStatus();
    const hasByok = window.snackClassifier.hasByokKey();
    const byokKey = window.snackClassifier.getByokKey();

    // 1. Update Server Key Status Badge
    if (this.serverKeyBadge) {
      if (status.hasServerKey) {
        this.serverKeyBadge.textContent = 'Active';
        this.serverKeyBadge.style.background = '#DCFCE7';
        this.serverKeyBadge.style.color = '#166534';
      } else {
        this.serverKeyBadge.textContent = 'Not Found';
        this.serverKeyBadge.style.background = '#FEE2E2';
        this.serverKeyBadge.style.color = '#991B1B';
      }
    }

    // 2. Update BYOK Key Status Badge & Input
    if (this.byokStatusBadge) {
      if (hasByok) {
        this.byokStatusBadge.textContent = 'Active (Personal Key)';
        this.byokStatusBadge.style.background = '#FEF08A';
        this.byokStatusBadge.style.color = '#854D0E';
        if (this.byokApiKeyInput && !this.byokApiKeyInput.value) {
          this.byokApiKeyInput.value = byokKey;
        }
      } else {
        this.byokStatusBadge.textContent = 'Using Server Key';
        this.byokStatusBadge.style.background = '#F1F5F9';
        this.byokStatusBadge.style.color = '#475569';
        if (this.byokApiKeyInput) {
          this.byokApiKeyInput.value = '';
        }
      }
    }

    // 3. Overall Indicator Dot & Text
    if (hasByok) {
      if (this.modelStatusDot) this.modelStatusDot.className = 'status-dot green';
      if (this.modelStatusText) this.modelStatusText.textContent = 'Status: 🟢 AI Vision Active';
      if (this.homeModelSummary) this.homeModelSummary.textContent = 'AI Ready 🟢';
    } else if (status.hasServerKey) {
      if (this.modelStatusDot) this.modelStatusDot.className = 'status-dot green';
      if (this.modelStatusText) this.modelStatusText.textContent = 'Status: 🟢 AI Vision Active';
      if (this.homeModelSummary) this.homeModelSummary.textContent = 'AI Ready 🟢';
    } else {
      if (this.modelStatusDot) this.modelStatusDot.className = 'status-dot yellow';
      if (this.modelStatusText) this.modelStatusText.textContent = 'Status: 🟡 AI Key Needed (Add below in ⚙️)';
      if (this.homeModelSummary) this.homeModelSummary.textContent = 'Add Key in ⚙️';
    }
  }
}

// Bootstrap on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.snackApp = new SnackDetectiveApp();
});
