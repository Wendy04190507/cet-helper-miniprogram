// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cet-helper-1gxxxx', // 替换为实际云环境ID
        traceUser: true,
      });
    }

    this.loadUserProfile();
  },

  globalData: {
    userProfile: null,       // { examType, examDate, selfEval, dailyTime }
    todayPlan: null,         // { date, tasks, completed, totalTime }
    isOnboarded: false,
  },

  async loadUserProfile() {
    const db = wx.cloud.database();
    try {
      const res = await db.collection('users').where({ _openid: '{openid}' }).get();
      if (res.data.length > 0) {
        this.globalData.userProfile = res.data[0];
        this.globalData.isOnboarded = true;
      }
    } catch (e) {
      console.log('用户尚未完成画像，进入 onboarding');
    }
  },

  async saveUserProfile(profile) {
    const db = wx.cloud.database();
    await db.collection('users').add({ data: profile });
    this.globalData.userProfile = profile;
    this.globalData.isOnboarded = true;
  },
});
