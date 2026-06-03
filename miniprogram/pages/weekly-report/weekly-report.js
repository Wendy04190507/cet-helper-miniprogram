// pages/weekly-report/weekly-report.js
const storage = require('../../utils/storage');
const { weekStart, today, daysBetween, formatDate } = require('../../utils/date');
const { MODULES } = require('../../utils/constants');

Page({
  data: {
    weeklyStats: {
      studyDays: 0,
      totalMinutes: 0,
      newWords: 0,
      tasksDone: 0,
      improvements: [],
    },
    aiMessage: '',
  },

  onShow() {
    this.generateReport();
  },

  generateReport() {
    const checkins = storage.get(storage.CACHE_KEYS.CHECK_INS) || [];
    const ws = weekStart();
    const todayStr = today();

    // 本周打卡天数
    const weekCheckins = checkins.filter(d => d >= ws && d <= todayStr);
    const studyDays = weekCheckins.length;

    // 统计本周任务完成数
    let tasksDone = 0;
    let totalMinutes = 0;
    weekCheckins.forEach(date => {
      const completedMap = storage.get(`completed_${date}`) || {};
      tasksDone += Object.keys(completedMap).length;

      const plan = storage.get(`${storage.CACHE_KEYS.TODAY_PLAN}_${date}`);
      if (plan) totalMinutes += plan.totalMinutes || 0;
    });

    // 统计新词数
    const userWords = storage.get(storage.CACHE_KEYS.USER_WORDS) || {};
    const newWords = Object.values(userWords).filter(w => {
      return w.history && w.history.some(h => h.date >= ws && h.date <= todayStr);
    }).length;

    // 模拟模块改进（实际项目从做题记录中统计正确率）
    const improvements = [
      { module: '听力', before: 56, after: 62, up: true },
      { module: '阅读', before: 70, after: 74, up: true },
      { module: '单词', before: 120, after: 183, up: true },
    ];

    // AI 鼓励语
    const encouragements = [
      '你的听力在慢慢变好，再坚持一周就能看到明显变化。',
      '这一周你做得很好，保持这个节奏，考试稳了。',
      '每一个单词都是通向高分的台阶，你正在积累复利。',
      '进步不是线性的，但你正在往对的方向走。',
    ];

    this.setData({
      weeklyStats: {
        studyDays,
        totalMinutes,
        newWords,
        tasksDone,
        improvements,
      },
      aiMessage: encouragements[Math.floor(Math.random() * encouragements.length)],
    });
  },

  onShareAppMessage() {
    return {
      title: `我这周学习了 ${this.data.weeklyStats.studyDays} 天，掌握了 ${this.data.weeklyStats.newWords} 个单词`,
      path: '/pages/index/index',
    };
  },
});
