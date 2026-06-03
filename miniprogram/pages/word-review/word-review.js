// pages/word-review/word-review.js
const { getDueWords, calculateNextReview, countByStatus } = require('../../utils/spaced-repetition');
const storage = require('../../utils/storage');

Page({
  data: {
    words: [],
    currentIndex: 0,
    currentWord: {},
    showComplete: false,
    stats: { known: 0, fuzzy: 0, unknown: 0 },
  },

  onLoad() {
    this.loadWords();
  },

  loadWords() {
    // 获取系统词库（本地缓存）
    let wordBank = storage.get(storage.CACHE_KEYS.WORD_BANK);

    // 如果缓存没有，初始化示例词库
    if (!wordBank || wordBank.length === 0) {
      wordBank = this.getSeedWordBank();
      storage.set(storage.CACHE_KEYS.WORD_BANK, wordBank);
    }

    // 获取用户词本记录
    let userWords = storage.get(storage.CACHE_KEYS.USER_WORDS) || {};

    // 获取今日应复习词汇
    const dueWordIds = getDueWords(
      Object.values(userWords).map(w => ({ ...w, status: w.status || 'learning' }))
    ).map(w => w.wordId);

    // 如果有到期词就复习到期词，否则学新词
    let wordsToReview;
    if (dueWordIds.length > 0) {
      wordsToReview = wordBank.filter(w => dueWordIds.includes(w.word));
    } else {
      // 取未学过的词
      wordsToReview = wordBank.filter(w => !userWords[w.word]);
      if (wordsToReview.length === 0) {
        wordsToReview = wordBank; // 全部学完，循环
      }
    }

    // 限制每日单词量
    const dailyLimit = 50;
    const selectedWords = wordsToReview.slice(0, dailyLimit);

    if (selectedWords.length === 0) {
      this.setData({ words: [] });
      return;
    }

    this.setData({
      words: selectedWords,
      currentIndex: 0,
      currentWord: selectedWords[0],
      stats: { known: 0, fuzzy: 0, unknown: 0 },
      userWords,
    });
  },

  getSeedWordBank() {
    // 种子词库 — 四六级高频词（实际项目会从云数据库下载完整3000词库）
    return [
      { word: 'abandon',    phonetic: '/əˈbændən/',  meaning: '放弃；抛弃',         example: 'He abandoned his plan.',                          exampleSource: 'CET-4 真题' },
      { word: 'inevitable', phonetic: '/ɪnˈevɪtəbl/', meaning: '不可避免的',          example: 'Change is inevitable in modern society.',         exampleSource: 'CET-6 真题' },
      { word: 'significant',phonetic: '/sɪɡˈnɪfɪkənt/',meaning: '重要的；显著的',     example: 'This is a significant discovery.',                exampleSource: 'CET-4 真题' },
      { word: 'approach',   phonetic: '/əˈprəʊtʃ/',   meaning: '方法；接近',          example: 'We need a new approach to this problem.',        exampleSource: 'CET-4 真题' },
      { word: 'consequence',phonetic: '/ˈkɒnsɪkwəns/',meaning: '后果；结果',         example: 'The consequences of climate change are severe.',  exampleSource: 'CET-6 真题' },
      { word: 'acquire',    phonetic: '/əˈkwaɪə(r)/', meaning: '获得；习得',          example: 'She acquired valuable skills during the internship.', exampleSource: 'CET-4 真题' },
      { word: 'phenomenon', phonetic: '/fɪˈnɒmɪnən/', meaning: '现象',               example: 'This phenomenon has attracted global attention.', exampleSource: 'CET-6 真题' },
      { word: 'sufficient', phonetic: '/səˈfɪʃnt/',   meaning: '足够的',             example: 'The evidence is not sufficient to prove his guilt.', exampleSource: 'CET-4 真题' },
      { word: 'controversy',phonetic: '/ˈkɒntrəvɜːsi/',meaning:'争议',              example: 'The issue has caused great controversy.',         exampleSource: 'CET-6 真题' },
      { word: 'domestic',   phonetic: '/dəˈmestɪk/',  meaning: '国内的；家庭的',     example: 'Domestic tourism has grown rapidly.',             exampleSource: 'CET-4 真题' },
      { word: 'promote',    phonetic: '/prəˈməʊt/',   meaning: '促进；推广',         example: 'We should promote cultural exchange.',            exampleSource: 'CET-4 真题' },
      { word: 'accelerate', phonetic: '/əkˈseləreɪt/',meaning: '加速',               example: 'Technology accelerates social change.',            exampleSource: 'CET-6 真题' },
      { word: 'fundamental',phonetic: '/ˌfʌndəˈmentl/',meaning:'基础的；根本的',    example: 'This is a fundamental principle of physics.',     exampleSource: 'CET-4 真题' },
      { word: 'diverse',    phonetic: '/daɪˈvɜːs/',   meaning: '多样的',             example: 'A diverse range of opinions was expressed.',      exampleSource: 'CET-4 真题' },
      { word: 'comprehensive',phonetic:'/ˌkɒmprɪˈhensɪv/',meaning:'全面的',         example: 'We conducted a comprehensive review.',            exampleSource: 'CET-6 真题' },
      { word: 'perspective',phonetic: '/pəˈspektɪv/', meaning: '视角；观点',         example: 'From a different perspective, this makes sense.', exampleSource: 'CET-6 真题' },
      { word: 'sustainable',phonetic: '/səˈsteɪnəbl/',meaning: '可持续的',          example: 'Sustainable development is our common goal.',     exampleSource: 'CET-6 真题' },
      { word: 'innovation', phonetic: '/ˌɪnəˈveɪʃn/', meaning: '创新',               example: 'Innovation drives economic growth.',              exampleSource: 'CET-6 真题' },
      { word: 'challenge',  phonetic: '/ˈtʃælɪndʒ/',  meaning: '挑战',              example: 'Climate change is a global challenge.',           exampleSource: 'CET-4 真题' },
      { word: 'access',     phonetic: '/ˈækses/',     meaning: '进入；获取',         example: 'Everyone should have access to education.',       exampleSource: 'CET-4 真题' },
    ];
  },

  onSwipe(e) {
    const { result } = e.detail;
    const { currentIndex, currentWord, words, stats, userWords } = this.data;

    // 更新统计
    stats[result]++;
    this.setData({ stats });

    // 更新用户词本
    const existing = userWords[currentWord.word] || {};
    const review = calculateNextReview(
      existing.interval || 0,
      result
    );

    userWords[currentWord.word] = {
      wordId: currentWord.word,
      interval: review.interval,
      nextReviewDate: review.nextDate,
      status: review.interval >= 5 ? 'mastered' : 'learning',
      history: [
        ...(existing.history || []),
        {
          date: require('../../utils/date').today(),
          result,
        },
      ],
    };

    storage.set(storage.CACHE_KEYS.USER_WORDS, userWords);

    // 下一个单词
    const nextIndex = currentIndex + 1;
    if (nextIndex < words.length) {
      this.setData({
        currentIndex: nextIndex,
        currentWord: words[nextIndex],
      });
    } else {
      this.setData({ showComplete: true, words: [] });
    }
  },

  dismissComplete() {
    this.setData({ showComplete: false });
    wx.navigateBack({ delta: 1 });
  },
});
