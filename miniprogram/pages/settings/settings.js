// pages/settings/settings.js
const app = getApp();
const storage = require('../../utils/storage');
const { daysBetween, today } = require('../../utils/date');

Page({
  data: {
    examLabel: '',
    examDate: '',
    dailyTime: '',
    streak: 0,
    fontSizes: ['小', '标准', '大'],
    fontSizeIndex: 1,
  },

  onShow() {
    this.loadProfile();
    this.loadStreak();
  },

  loadProfile() {
    const profile = app.globalData.userProfile || storage.get(storage.CACHE_KEYS.USER_PROFILE);
    if (profile) {
      const examLabel = profile.examType === 'cet4' ? 'CET-4 四级' : 'CET-6 六级';
      const timeLabel = profile.dailyTime === '60min' ? '1 小时'
        : profile.dailyTime === '30min' ? '30 分钟'
        : profile.dailyTime === '15min' ? '15 分钟'
        : `${profile.customMinutes || 30} 分钟`;

      this.setData({
        examLabel,
        examDate: profile.examDate,
        dailyTime: timeLabel,
      });
    }
  },

  loadStreak() {
    const checkins = storage.get(storage.CACHE_KEYS.CHECK_INS) || [];
    const todayStr = today();
    let streak = 0;
    let check = new Date(todayStr);

    if (!checkins.includes(todayStr)) {
      check.setDate(check.getDate() - 1);
    }

    while (true) {
      const ds = require('../../utils/date').formatDate(check);
      if (checkins.includes(ds)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }

    this.setData({ streak });
  },

  editProfile() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding' });
  },

  goWeeklyReport() {
    wx.navigateTo({ url: '/pages/weekly-report/weekly-report' });
  },

  goOnboarding() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding' });
  },

  onFontChange(e) {
    this.setData({ fontSizeIndex: parseInt(e.detail.value) });
  },
});
