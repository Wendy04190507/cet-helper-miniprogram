// components/word-card/word-card.js
Component({
  properties: {
    word:           { type: String, value: '' },
    phonetic:       { type: String, value: '' },
    meaning:        { type: String, value: '' },
    example:        { type: String, value: '' },
    exampleSource:  { type: String, value: '' },
    current:        { type: Number, value: 0 },
    total:          { type: Number, value: 0 },
  },

  data: {
    showMeaning: false,
    offsetX: 0,
    offsetY: 0,
    rotate: 0,
    swipeDir: '',
    startX: 0,
    startY: 0,
    animating: false,
    hasInteracted: false,
  },

  methods: {
    onTouchStart(e) {
      this.setData({
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        offsetX: 0,
        offsetY: 0,
        rotate: 0,
        swipeDir: '',
        animating: false,
      });
    },

    onTouchMove(e) {
      if (this.data.animating) return;
      const dx = e.touches[0].clientX - this.data.startX;
      const dy = e.touches[0].clientY - this.data.startY;
      const rotate = dx * 0.05;
      let swipeDir = '';

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
        swipeDir = dx > 0 ? 'right' : 'left';
      } else if (Math.abs(dy) > Math.abs(dx) && dy > 40) {
        swipeDir = 'down';
      }

      this.setData({ offsetX: dx, offsetY: dy, rotate, swipeDir });
    },

    onTouchEnd(e) {
      if (this.data.animating) return;
      const dx = this.data.offsetX;
      const dy = this.data.offsetY;
      const threshold = 80;

      // 下滑 → 显示释义（第一优先级，小移动就触发）
      if (dy > 40 && Math.abs(dx) < 60 && !this.data.showMeaning) {
        this.setData({ showMeaning: true, offsetX: 0, offsetY: 0, rotate: 0, swipeDir: '' });
        return;
      }

      // 左滑 → 不认识
      if (dx < -threshold) {
        this.finishCard('unknown', 'left');
        return;
      }

      // 右滑 → 认识
      if (dx > threshold) {
        this.finishCard('known', 'right');
        return;
      }

      // 下滑 → 模糊（已经显示了释义的情况下）
      if (dy > threshold && this.data.showMeaning) {
        this.finishCard('fuzzy', 'down');
        return;
      }

      // 回弹
      this.setData({ offsetX: 0, offsetY: 0, rotate: 0, swipeDir: '' });
    },

    finishCard(result, direction) {
      this.setData({
        animating: true,
        swipeDir: direction,
        hasInteracted: true,
      });

      setTimeout(() => {
        this.triggerEvent('swipe', { result });
        this.setData({
          showMeaning: false,
          offsetX: 0,
          offsetY: 0,
          rotate: 0,
          swipeDir: '',
          animating: false,
        });
      }, 300);
    },

    // 外部可调用，显示释义
    show() {
      this.setData({ showMeaning: true });
    },

    // 重置卡片状态（外部调用）
    reset() {
      this.setData({
        showMeaning: false,
        offsetX: 0,
        offsetY: 0,
        rotate: 0,
        swipeDir: '',
        animating: false,
        hasInteracted: false,
      });
    },
  },
});
