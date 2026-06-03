// components/checkin-calendar/checkin-calendar.js
const { today, formatDate } = require('../../utils/date');

Component({
  properties: {
    checkins: {
      type: Array, // ['2026-06-01', '2026-06-02', ...]
      value: [],
    },
  },

  data: {
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    year: 2026,
    month: 6,
    days: [],
    streak: 0,
  },

  lifetimes: {
    attached() {
      this.buildCalendar();
    },
  },

  observers: {
    'checkins': function () {
      this.buildCalendar();
    },
  },

  methods: {
    buildCalendar() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const todayStr = today();

      // 当月第一天是星期几
      const firstDay = new Date(year, month - 1, 1).getDay();
      const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1; // 周一为0

      // 当月天数
      const daysInMonth = new Date(year, month, 0).getDate();

      const checkinSet = new Set(this.properties.checkins || []);
      const days = [];

      // 填充前置空白
      for (let i = 0; i < adjustedFirst; i++) {
        days.push({ empty: true });
      }

      // 填充日期
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = formatDate(new Date(year, month - 1, d));
        days.push({
          num: d,
          date: dateStr,
          isToday: dateStr === todayStr,
          checked: checkinSet.has(dateStr),
          wasChecked: checkinSet.has(dateStr),
          empty: false,
        });
      }

      // 计算连续打卡天数
      const streak = this.calculateStreak(checkinSet, todayStr);

      this.setData({ year, month, days, streak });
    },

    calculateStreak(checkinSet, todayStr) {
      let streak = 0;
      let check = new Date(todayStr);

      // 如果今天没打卡，从昨天开始检查
      if (!checkinSet.has(todayStr)) {
        check.setDate(check.getDate() - 1);
      }

      while (true) {
        const dateStr = formatDate(check);
        if (checkinSet.has(dateStr)) {
          streak++;
          check.setDate(check.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    },
  },
});
