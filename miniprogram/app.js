// app.js — CET Helper 四六级备考助手
App({
  onLaunch: function () {
    // 云能力初始化（如未开通云开发也不影响基础功能）
    if (wx.cloud) {
      try {
        wx.cloud.init({
          // ⚠️ 替换为你的云环境 ID（开通云开发后在控制台复制）
          // 格式示例：cet-helper-1gxxxx
          env: '',
          traceUser: true,
        });
      } catch (e) {
        console.warn('云开发初始化失败，将使用本地模式:', e.message);
      }
    }

    // 加载本地用户画像（优先本地，云数据库作为备份同步）
    this.loadLocalProfile();
  },

  globalData: {
    userProfile: null,
    todayPlan: null,
    isOnboarded: false,
    cloudReady: false,
  },

  loadLocalProfile() {
    try {
      const profile = wx.getStorageSync('cet_user_profile');
      if (profile) {
        this.globalData.userProfile = profile;
        this.globalData.isOnboarded = true;
        console.log('已加载本地画像');
      }
    } catch (e) {
      console.log('无本地画像，需完成入学评估');
    }

    // 如有云能力，同步加载云端数据
    if (wx.cloud) {
      this.syncFromCloud();
    }
  },

  async syncFromCloud() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('users').where({ _openid: '{openid}' }).get();
      if (res.data.length > 0) {
        const cloudProfile = res.data[0];
        this.globalData.userProfile = cloudProfile;
        this.globalData.isOnboarded = true;
        // 同步到本地
        wx.setStorageSync('cet_user_profile', cloudProfile);
      }
      this.globalData.cloudReady = true;
    } catch (e) {
      console.log('云端同步跳过（可能未开通云开发或未创建集合）:', e.message);
    }
  },

  saveUserProfile(profile) {
    this.globalData.userProfile = profile;
    this.globalData.isOnboarded = true;

    // 始终保存到本地
    try {
      wx.setStorageSync('cet_user_profile', profile);
    } catch (e) {
      console.error('本地保存失败:', e);
    }

    // 如有云能力，同步到云端
    if (this.globalData.cloudReady && wx.cloud) {
      const db = wx.cloud.database();
      db.collection('users').add({ data: profile }).catch(() => {});
    }
  },

  updateProfile(updates) {
    const profile = { ...this.globalData.userProfile, ...updates };
    this.saveUserProfile(profile);
  },
});
