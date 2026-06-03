// utils/spaced-repetition.js
// 艾宾浩斯遗忘曲线调度引擎

const INTERVALS = [1, 2, 4, 7, 15, 30]; // 天
const { addDays, today } = require('./date');

/**
 * 根据用户反馈计算下一个间隔
 * @param {number} currentInterval - 当前间隔索引 (0-5)
 * @param {string} result - 'known' | 'fuzzy' | 'unknown'
 * @returns {{ interval: number, nextDate: string }}
 */
function calculateNextReview(currentInterval, result) {
  let nextInterval;

  switch (result) {
    case 'known':
      // 认识 → 进入下一间隔
      nextInterval = Math.min(currentInterval + 1, INTERVALS.length - 1);
      break;
    case 'fuzzy':
      // 模糊 → 回退一个间隔（最少保持在1天）
      nextInterval = Math.max(currentInterval - 1, 0);
      break;
    case 'unknown':
    default:
      // 不认识 → 回到1天
      nextInterval = 0;
      break;
  }

  return {
    interval: nextInterval,
    intervalDays: INTERVALS[nextInterval],
    nextDate: addDays(today(), INTERVALS[nextInterval]),
  };
}

/**
 * 获取今日需要复习的单词列表
 * @param {Array} userWords - 用户单词记录
 * @returns {Array} 需要今天复习的单词
 */
function getDueWords(userWords) {
  const todayStr = today();
  return userWords.filter(w => {
    if (w.status === 'mastered') return false;
    if (!w.nextReviewDate) return true; // 新词
    return w.nextReviewDate <= todayStr;
  });
}

/**
 * 统计各状态单词数
 * @returns {{ learning: number, review: number, mastered: number }}
 */
function countByStatus(userWords) {
  const due = getDueWords(userWords);
  const newWords = due.filter(w => !w.interval || w.interval === 0).length;
  const reviewWords = due.filter(w => w.interval && w.interval > 0).length;
  const mastered = userWords.filter(w => w.status === 'mastered').length;

  return {
    newWords,
    reviewWords,
    mastered,
    total: userWords.length,
  };
}

/**
 * 判断一个单词是否已完全掌握（间隔到达最大值且上次正确）
 */
function isMastered(wordRecord) {
  return wordRecord.interval >= INTERVALS.length - 1
    && wordRecord.history
    && wordRecord.history.length > 0
    && wordRecord.history[wordRecord.history.length - 1].result === 'known';
}

module.exports = {
  INTERVALS,
  calculateNextReview,
  getDueWords,
  countByStatus,
  isMastered,
};
