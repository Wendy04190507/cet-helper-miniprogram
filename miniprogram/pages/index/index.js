// pages/index/index.js
const app = getApp();
const { today, daysBetween, formatDate } = require('../../utils/date');
const { generateDailyPlan, generateMinimalPlan } = require('../../utils/plan-engine');
const { MODULES } = require('../../utils/constants');
const storage = require('../../utils/storage');

Page({
  data: {
    hasPlan: false,
    dateDisplay: '',
    remainingDays: 0,
    completedCount: 0,
    totalTasks: 0,
    tasks: [],
    checkins: [],
    isMinimal: false,
    canQuickStart: false,
  },

  onShow() {
    this.checkOnboarding();
    if (app.globalData.isOnboarded) {
      this.loadToday();
    }
  },

  checkOnboarding() {
    const profile = app.globalData.userProfile || storage.get(storage.CACHE_KEYS.USER_PROFILE);
    if (!profile) {
      this.setData({ hasPlan: false });
      return;
    }

    if (!app.globalData.userProfile) {
      app.globalData.userProfile = profile;
      app.globalData.isOnboarded = true;
    }
  },

  loadToday() {
    const profile = app.globalData.userProfile;
    if (!profile) return;

    const todayStr = today();
    const remainingDays = daysBetween(todayStr, profile.examDate);

    // 尝试从缓存获取今日计划
    let plan = storage.get(`${storage.CACHE_KEYS.TODAY_PLAN}_${todayStr}`);

    if (!plan) {
      plan = generateDailyPlan(profile, remainingDays);
      storage.set(`${storage.CACHE_KEYS.TODAY_PLAN}_${todayStr}`, plan);
    }

    // 从缓存获取已完成状态
    const completedMap = storage.get(`completed_${todayStr}`) || {};
    const tasks = plan.tasks.map(t => {
      const icon = t.type === 'vocabulary' ? MODULES.vocabulary.icon
        : (MODULES[t.type] ? MODULES[t.type].icon : '📋');
      return {
        ...t,
        icon,
        isCompleted: !!completedMap[t.id],
      };
    });

    const completedCount = tasks.filter(t => t.isCompleted).length;
    const checkins = storage.get(storage.CACHE_KEYS.CHECK_INS) || [];

    // 格式化日期
    const d = new Date();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const dateDisplay = `${d.getMonth() + 1}月${d.getDate()}日 · 星期${weekdays[d.getDay()]}`;

    this.setData({
      hasPlan: true,
      dateDisplay,
      remainingDays,
      tasks,
      totalTasks: tasks.length,
      completedCount,
      checkins,
      canQuickStart: !app.globalData.isOnboarded,
    });
  },

  onTaskToggle(e) {
    const { taskId, completed } = e.detail;
    const todayStr = today();
    const completedMap = storage.get(`completed_${todayStr}`) || {};

    if (completed) {
      completedMap[taskId] = true;
    } else {
      delete completedMap[taskId];
    }

    storage.set(`completed_${todayStr}`, completedMap);

    // 更新任务状态
    const tasks = this.data.tasks.map(t => ({
      ...t,
      isCompleted: taskId === t.id ? completed : t.isCompleted,
    }));

    const completedCount = tasks.filter(t => t.isCompleted).length;

    // 全部完成 → 自动打卡
    if (completedCount === tasks.length) {
      const checkins = storage.get(storage.CACHE_KEYS.CHECK_INS) || [];
      if (!checkins.includes(todayStr)) {
        checkins.push(todayStr);
        storage.set(storage.CACHE_KEYS.CHECK_INS, checkins);
        this.setData({ checkins });
        wx.showToast({ title: '今日全部完成 🎉', icon: 'none' });
      }
    }

    this.setData({ tasks, completedCount });
  },

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    const isMinimal = mode === 'minimal';
    this.setData({ isMinimal });

    if (isMinimal) {
      const plan = generateMinimalPlan();
      const tasks = plan.tasks.map(t => ({
        ...t,
        icon: t.type === 'vocabulary' ? '📝' : '🎧',
        isCompleted: false,
      }));
      this.setData({ tasks, totalTasks: tasks.length, completedCount: 0 });
    } else {
      this.loadToday(); // 重新加载正常计划
    }
  },

  startStudy() {
    wx.navigateTo({ url: '/pages/pomodoro/pomodoro' });
  },

  startQuick() {
    // 快速开始：使用默认画像
    const defaultProfile = {
      examType: 'cet4',
      examDate: require('../../utils/date').getDefaultExamDate(),
      remainingDays: 90,
      selfEval: { listening: 3, reading: 3, writing: 3, translation: 3 },
      dailyTime: '30min',
      createdAt: today(),
    };

    app.globalData.userProfile = defaultProfile;
    app.globalData.isOnboarded = true;
    storage.set(storage.CACHE_KEYS.USER_PROFILE, defaultProfile);
    this.loadToday();
  },

  goOnboarding() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding' });
  },
});
