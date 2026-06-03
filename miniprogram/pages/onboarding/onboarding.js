// pages/onboarding/onboarding.js
const app = getApp();
const { MODULES } = require('../../utils/constants');
const { getDefaultExamDate, daysBetween, today } = require('../../utils/date');

Page({
  data: {
    currentStep: 0,
    examType: '',
    examDate: '',
    minDate: today(),
    remainingDays: 0,
    selfEval: { listening: 0, reading: 0, writing: 0, translation: 0 },
    dailyTime: '',
    modules: [
      MODULES.listening,
      MODULES.reading,
      MODULES.writing,
      MODULES.translation,
    ],
    hasEval: false,
    radarData: [],
    canNext: false,
  },

  onLoad() {
    // 检查是否已完成 onboarding
    if (app.globalData.isOnboarded) {
      wx.switchTab({ url: '/pages/index/index' });
    }
    this.setData({ examDate: getDefaultExamDate() });
    this.updateRemainingDays();
  },

  selectExam(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ examType: type, canNext: true });
  },

  onDateChange(e) {
    this.setData({ examDate: e.detail.value });
    this.updateRemainingDays();
  },

  updateRemainingDays() {
    const days = daysBetween(today(), this.data.examDate);
    this.setData({ remainingDays: days });
  },

  setEval(e) {
    const { module, score } = e.currentTarget.dataset;
    const selfEval = { ...this.data.selfEval, [module]: score };
    const hasEval = Object.values(selfEval).every(v => v > 0);

    // 构建雷达图数据
    const radarData = Object.entries(selfEval).map(([key, value]) => ({
      label: MODULES[key].label,
      value: value,
      max: 5,
      color: MODULES[key].color,
    }));

    this.setData({
      selfEval,
      hasEval,
      radarData,
      canNext: hasEval,
    });
  },

  setTime(e) {
    this.setData({ dailyTime: e.currentTarget.dataset.time });
  },

  nextStep() {
    if (!this.data.canNext) return;
    if (this.data.currentStep === 1) {
      this.updateRemainingDays();
    }
    this.setData({
      currentStep: this.data.currentStep + 1,
      canNext: this.data.currentStep >= 2,
    });
  },

  async finishOnboarding() {
    if (!this.data.dailyTime) {
      wx.showToast({ title: '请选择每日用时', icon: 'none' });
      return;
    }

    const profile = {
      examType: this.data.examType,
      examDate: this.data.examDate,
      remainingDays: this.data.remainingDays,
      selfEval: this.data.selfEval,
      dailyTime: this.data.dailyTime,
      createdAt: today(),
    };

    try {
      await app.saveUserProfile(profile);
      wx.showToast({ title: '准备好了！', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 800);
    } catch (e) {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      console.error(e);
    }
  },
});
