// utils/plan-engine.js
// 每日学习计划生成算法

const { MODULES, TASK_TEMPLATES } = require('./constants');
const { today, daysBetween } = require('./date');

/**
 * 计算各模块权重（短板优先）
 * @param {Object} selfEval - { listening, reading, writing, translation } 各1-5分
 * @returns {Object} 各模块权重，总和为1
 */
function calculateModuleWeights(selfEval) {
  const weights = {};
  let totalWeight = 0;

  // 短板逆序加权：分数越低，权重越高
  const inverseScore = {};
  Object.entries(selfEval).forEach(([module, score]) => {
    inverseScore[module] = 6 - score; // 1分→5权重, 5分→1权重
    totalWeight += inverseScore[module];
  });

  Object.keys(selfEval).forEach(module => {
    weights[module] = inverseScore[module] / totalWeight;
  });

  return weights;
}

/**
 * 根据用时档位返回各模块任务数量
 * @param {string} dailyTime - '15min' | '30min' | '60min' | 'custom'
 * @param {number} customMinutes - 自定义分钟数
 */
function getTaskCountByTime(dailyTime, customMinutes = 30) {
  const minutes = dailyTime === 'custom'
    ? customMinutes
    : parseInt(dailyTime);

  if (minutes <= 15)  return { total: 2, newWords: 5 };
  if (minutes <= 30)  return { total: 3, newWords: 10 };
  if (minutes <= 60)  return { total: 4, newWords: 15 };
  return { total: 5, newWords: 20 };
}

/**
 * 生成当日学习计划
 * @param {Object} userProfile - 用户画像
 * @param {number} remainingDays - 距考试剩余天数
 * @returns {Object} { date, tasks, totalMinutes }
 */
function generateDailyPlan(userProfile, remainingDays) {
  const { selfEval, dailyTime, customMinutes } = userProfile;
  const weights = calculateModuleWeights(selfEval);
  const { total, newWords } = getTaskCountByTime(dailyTime, customMinutes);

  // 判断是否为考前模式（<30天）
  const isPreExam = remainingDays <= 30;

  // 按权重排序，权重高的模块优先分配任务
  const sortedModules = Object.entries(weights)
    .sort((a, b) => b[1] - a[1]);

  const tasks = [];
  let taskIndex = 0;

  // 每天必须有单词任务（新词 + 复习）
  tasks.push({
    id: `${today()}_word_new`,
    ...TASK_TEMPLATES.word_new,
    targetCount: newWords,
    priority: 'high',
  });

  tasks.push({
    id: `${today()}_word_review`,
    ...TASK_TEMPLATES.word_review,
    priority: 'high',
  });

  // 分配其他模块任务（扣除单词任务后剩余个数）
  const remainingTasks = total - 2;
  const moduleTaskMap = {
    listening:    TASK_TEMPLATES.listening_intensive,
    reading:      TASK_TEMPLATES.reading_match,
    writing:      TASK_TEMPLATES.writing_skeleton,
    translation:  TASK_TEMPLATES.translation_split,
  };

  for (let i = 0; i < remainingTasks; i++) {
    const moduleIndex = i % sortedModules.length;
    const [moduleKey] = sortedModules[moduleIndex];

    if (moduleTaskMap[moduleKey] && moduleKey !== 'vocabulary') {
      const template = moduleTaskMap[moduleKey];
      tasks.push({
        id: `${today()}_${moduleKey}_${i}`,
        ...template,
        // 考前模式增加模考相关提示
        ...(isPreExam && { label: template.label + '（考前冲刺）' }),
        priority: weights[moduleKey] > 0.35 ? 'high' : 'normal',
      });
    }

    taskIndex++;
  }

  // 考前模式：额外增加整卷提示
  if (isPreExam && remainingDays % 3 === 0) {
    tasks.push({
      id: `${today()}_mock`,
      type: 'mock',
      subtype: 'full_mock',
      label: '整卷模考',
      defaultDuration: 30,
      description: '限时完整模考 · 考前冲刺',
      priority: 'high',
    });
  }

  const totalMinutes = tasks.reduce((sum, t) => sum + (t.defaultDuration || 0), 0);

  return {
    date: today(),
    tasks,
    totalMinutes,
    isPreExam,
    remainingDays,
  };
}

/**
 * 生成极简模式计划（5词 + 3分钟听力 = 8分钟）
 */
function generateMinimalPlan() {
  return {
    date: today(),
    tasks: [
      { id: `${today()}_mini_word`, ...TASK_TEMPLATES.word_new, targetCount: 5, defaultDuration: 3 },
      {
        id: `${today()}_mini_listening`,
        type: 'listening',
        subtype: 'mini',
        label: '听力碎片',
        defaultDuration: 3,
        description: '1段短对话 · 抓信号词',
      },
    ],
    totalMinutes: 8,
    isMinimal: true,
  };
}

module.exports = {
  calculateModuleWeights,
  generateDailyPlan,
  generateMinimalPlan,
};
