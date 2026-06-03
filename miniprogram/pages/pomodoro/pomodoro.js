// pages/pomodoro/pomodoro.js
const { today } = require('../../utils/date');

Page({
  data: {
    duration: 25,         // 分钟
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    minutes: '25',
    seconds: '00',
    isRunning: false,
    isPaused: false,
    currentTask: null,

    // 植物生长
    plantStage: '🌱',
    plantMessage: '完成一次专注，种子就会长大',

    // Study With Me
    onlineCount: 0,
    peers: [],
  },

  timer: null,

  onLoad() {
    this.updateDisplay();
    this.simulatePeers();
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },

  updateDisplay() {
    const min = Math.floor(this.data.remainingSeconds / 60);
    const sec = this.data.remainingSeconds % 60;
    this.setData({
      minutes: String(min).padStart(2, '0'),
      seconds: String(sec).padStart(2, '0'),
    });
    this.drawRing();
  },

  drawRing() {
    const progress = 1 - (this.data.remainingSeconds / this.data.totalSeconds);

    const query = this.createSelectorQuery();
    query.select('#ringCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const size = 200; // 400rpx -> 200px (approx)
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const cx = size / 2;
        const cy = size / 2;
        const r = size / 2 - 10;

        // 清除
        ctx.clearRect(0, 0, size, size);

        // 进度环
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();
      });
  },

  updatePlant() {
    const progress = 1 - (this.data.remainingSeconds / this.data.totalSeconds);
    if (progress < 0.25) this.setData({ plantStage: '🌱', plantMessage: '刚开始生长...' });
    else if (progress < 0.5) this.setData({ plantStage: '🪴', plantMessage: '正在茁壮成长' });
    else if (progress < 0.75) this.setData({ plantStage: '🌿', plantMessage: '快要完成了' });
    else if (progress < 1) this.setData({ plantStage: '🌳', plantMessage: '再坚持一下！' });
    else this.setData({ plantStage: '🌲', plantMessage: '完成了！真棒 ✨' });
  },

  startTimer() {
    this.setData({
      isRunning: true,
      totalSeconds: this.data.duration * 60,
      remainingSeconds: this.data.duration * 60,
    });
    this.updateDisplay();

    // 设置当前任务（如果有首页计划则显示第一个未完成任务）
    const storage = require('../../utils/storage');
    const plan = storage.get(`${storage.CACHE_KEYS.TODAY_PLAN}_${today()}`);
    if (plan && plan.tasks) {
      const nextTask = plan.tasks.find(t => {
        const completedMap = storage.get(`completed_${today()}`) || {};
        return !completedMap[t.id];
      });
      if (nextTask) {
        const { MODULES } = require('../../utils/constants');
        this.setData({
          currentTask: {
            label: nextTask.label,
            icon: MODULES[nextTask.type] ? MODULES[nextTask.type].icon : '📋',
          },
        });
      }
    }

    this.runTimer();
  },

  runTimer() {
    this.timer = setInterval(() => {
      if (this.data.remainingSeconds <= 0) {
        clearInterval(this.timer);
        this.setData({ isRunning: false, isPaused: false });
        this.updatePlant();
        wx.showToast({ title: '番茄钟完成！', icon: 'success' });
        return;
      }

      const remaining = this.data.remainingSeconds - 1;
      this.setData({ remainingSeconds: remaining });
      this.updateDisplay();

      // 每10秒更新一次植物
      if (remaining % 10 === 0) {
        this.updatePlant();
      }
    }, 1000);
  },

  pauseTimer() {
    if (this.timer) clearInterval(this.timer);
    this.setData({ isPaused: true });
  },

  resumeTimer() {
    this.setData({ isPaused: false });
    this.runTimer();
  },

  skipTask() {
    this.setData({ currentTask: null });
  },

  setDuration(e) {
    const min = parseInt(e.currentTarget.dataset.min);
    if (!this.data.isRunning && !this.data.isPaused) {
      this.setData({
        duration: min,
        remainingSeconds: min * 60,
      });
      this.updateDisplay();
    }
  },

  simulatePeers() {
    // 模拟学习同伴数据（实际项目中从云数据库获取实时数据）
    const samplePeers = [
      { id: 1, name: '北京大学', task: '听力精听' },
      { id: 2, name: '匿名用户', task: '单词复习' },
      { id: 3, name: '浙江大学', task: '翻译练习' },
      { id: 4, name: '匿名用户', task: '阅读训练' },
      { id: 5, name: '武汉大学', task: '单词复习' },
    ];

    // 随机取几个
    const count = 2 + Math.floor(Math.random() * 4);
    const peers = samplePeers.slice(0, count);
    const onlineCount = 2314 + Math.floor(Math.random() * 200);

    this.setData({ peers, onlineCount });
  },
});
