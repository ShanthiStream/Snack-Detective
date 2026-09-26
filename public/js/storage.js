// LocalStorage manager for badges, streaks, scan history, and settings

const DEFAULT_BADGES = [
  {
    id: 'first_scan',
    title: 'First Case Solved',
    desc: 'Investigate your very first snack!',
    icon: '🔍',
    category: 'starter',
    target: 1,
    current: 0,
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'veggie_hero',
    title: 'Veggie Hero',
    desc: 'Scan 3 Super Healthy snacks!',
    icon: '🥕',
    category: 'healthy',
    target: 3,
    current: 0,
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'fruit_star',
    title: 'Fruit Star',
    desc: 'Scan 5 Super Healthy snacks!',
    icon: '🍎',
    category: 'healthy',
    target: 5,
    current: 0,
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'balanced_eater',
    title: 'Balanced Sleuth',
    desc: 'Investigate both a Healthy snack and a Treat!',
    icon: '⚖️',
    category: 'balance',
    target: 2, // 1 healthy + 1 treat
    current: 0,
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'streak_sleuth',
    title: 'Streak Sleuth',
    desc: 'Scan 3 Healthy snacks in a row!',
    icon: '🔥',
    category: 'streak',
    target: 3,
    current: 0,
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'rainbow_plate',
    title: 'Rainbow Detective',
    desc: 'Log 8 snacks in your Detective Notebook!',
    icon: '🌈',
    category: 'collection',
    target: 8,
    current: 0,
    unlocked: false,
    unlockedAt: null
  },
  {
    id: 'master_detective',
    title: 'Chief Detective',
    desc: 'Solve 15 total snack mysteries!',
    icon: '🏆',
    category: 'mastery',
    target: 15,
    current: 0,
    unlocked: false,
    unlockedAt: null
  }
];

class DetectiveStorage {
  constructor() {
    this.STORAGE_KEY_PREFIX = 'snack_detective_';
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.STORAGE_KEY_PREFIX + 'badges')) {
      localStorage.setItem(this.STORAGE_KEY_PREFIX + 'badges', JSON.stringify(DEFAULT_BADGES));
    }
    if (!localStorage.getItem(this.STORAGE_KEY_PREFIX + 'stats')) {
      const stats = {
        totalScans: 0,
        healthyCount: 0,
        treatCount: 0,
        currentHealthyStreak: 0,
        longestStreak: 0,
        detectiveStars: 0
      };
      localStorage.setItem(this.STORAGE_KEY_PREFIX + 'stats', JSON.stringify(stats));
    }
    if (!localStorage.getItem(this.STORAGE_KEY_PREFIX + 'history')) {
      localStorage.setItem(this.STORAGE_KEY_PREFIX + 'history', JSON.stringify([]));
    }
  }

  getStats() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY_PREFIX + 'stats')) || {};
    } catch (e) {
      return { totalScans: 0, healthyCount: 0, treatCount: 0, currentHealthyStreak: 0, longestStreak: 0, detectiveStars: 0 };
    }
  }

  saveStats(stats) {
    localStorage.setItem(this.STORAGE_KEY_PREFIX + 'stats', JSON.stringify(stats));
  }

  getBadges() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY_PREFIX + 'badges')) || [];
      // Merge with defaults if new badges were introduced
      return DEFAULT_BADGES.map(def => {
        const found = saved.find(b => b.id === def.id);
        return found ? { ...def, ...found } : def;
      });
    } catch (e) {
      return DEFAULT_BADGES;
    }
  }

  saveBadges(badges) {
    localStorage.setItem(this.STORAGE_KEY_PREFIX + 'badges', JSON.stringify(badges));
  }

  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY_PREFIX + 'history')) || [];
    } catch (e) {
      return [];
    }
  }

  addScanRecord(scan) {
    const history = this.getHistory();
    const stats = this.getStats();
    const badges = this.getBadges();
    const newlyUnlockedBadges = [];

    // Update stats
    stats.totalScans += 1;
    stats.detectiveStars += (scan.verdict === 'Healthy' ? 2 : 1);

    if (scan.verdict === 'Healthy') {
      stats.healthyCount += 1;
      stats.currentHealthyStreak += 1;
      if (stats.currentHealthyStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentHealthyStreak;
      }
    } else {
      stats.treatCount += 1;
      // Gently reset streak without penalizing points
      stats.currentHealthyStreak = 0;
    }

    this.saveStats(stats);

    // Save to history (keep recent 50)
    history.unshift({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      verdict: scan.verdict,
      confidence: scan.confidence,
      snackName: scan.snackName || (scan.verdict === 'Healthy' ? 'Healthy Snack' : 'Tasty Treat'),
      thumbnail: scan.thumbnail || '',
      tip: scan.tip || ''
    });

    if (history.length > 50) history.pop();
    localStorage.setItem(this.STORAGE_KEY_PREFIX + 'history', JSON.stringify(history));

    // Evaluate Badges
    badges.forEach(badge => {
      if (badge.unlocked) return;

      if (badge.id === 'first_scan') {
        badge.current = Math.min(stats.totalScans, badge.target);
      } else if (badge.id === 'veggie_hero' || badge.id === 'fruit_star') {
        badge.current = Math.min(stats.healthyCount, badge.target);
      } else if (badge.id === 'balanced_eater') {
        badge.current = (stats.healthyCount > 0 ? 1 : 0) + (stats.treatCount > 0 ? 1 : 0);
      } else if (badge.id === 'streak_sleuth') {
        badge.current = Math.min(stats.currentHealthyStreak, badge.target);
      } else if (badge.id === 'rainbow_plate' || badge.id === 'master_detective') {
        badge.current = Math.min(stats.totalScans, badge.target);
      }

      if (badge.current >= badge.target && !badge.unlocked) {
        badge.unlocked = true;
        badge.unlockedAt = new Date().toISOString();
        newlyUnlockedBadges.push(badge);
      }
    });

    this.saveBadges(badges);

    return {
      stats,
      newlyUnlockedBadges
    };
  }

  clearHistory() {
    localStorage.setItem(this.STORAGE_KEY_PREFIX + 'history', JSON.stringify([]));
  }

  getModelSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY_PREFIX + 'model_settings')) || {};
      return {
        engineMode: saved.engineMode || 'hybrid', // 'hybrid', 'teachable_machine', 'gemini_only', 'heuristic'
        tmUrl: saved.tmUrl || saved.url || '',
        url: saved.tmUrl || saved.url || '',
        geminiApiKey: saved.geminiApiKey || '',
        geminiModel: saved.geminiModel || 'gemini-1.5-flash',
        status: saved.status || 'ready',
        labels: saved.labels || []
      };
    } catch (e) {
      return {
        engineMode: 'hybrid',
        tmUrl: '',
        url: '',
        geminiApiKey: '',
        geminiModel: 'gemini-1.5-flash',
        status: 'ready',
        labels: []
      };
    }
  }

  saveModelSettings(settings) {
    const current = this.getModelSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(this.STORAGE_KEY_PREFIX + 'model_settings', JSON.stringify(updated));
  }
}

window.detectiveStorage = new DetectiveStorage();
