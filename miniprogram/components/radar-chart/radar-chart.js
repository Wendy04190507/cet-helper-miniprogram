// components/radar-chart/radar-chart.js
Component({
  properties: {
    data: {
      type: Array, // [{ label: '听力', value: 3, max: 5, color: '#007aff' }]
      value: [],
    },
    width:  { type: Number, value: 300 },
    height: { type: Number, value: 300 },
  },

  lifetimes: {
    attached() {
      this.drawChart();
    },
  },

  observers: {
    'data': function () {
      this.drawChart();
    },
  },

  methods: {
    drawChart() {
      const data = this.properties.data;
      if (!data || data.length === 0) return;

      const width = this.properties.width;
      const height = this.properties.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 40;
      const count = data.length;

      const query = this.createSelectorQuery();
      query.select('#radarCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          // 绘制背景网格
          this.drawGrid(ctx, centerX, centerY, radius, count);

          // 绘制数据区域
          this.drawData(ctx, centerX, centerY, radius, count, data);

          // 绘制标签
          this.drawLabels(ctx, centerX, centerY, radius, count, data);
        });
    },

    drawGrid(ctx, cx, cy, r, count) {
      const levels = 5;
      ctx.strokeStyle = '#e5e5ea';
      ctx.lineWidth = 1;

      for (let l = 1; l <= levels; l++) {
        const ratio = l / levels;
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
          const x = cx + r * ratio * Math.cos(angle);
          const y = cy + r * ratio * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // 轴线
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        ctx.stroke();
      }
    },

    drawData(ctx, cx, cy, r, count, data) {
      ctx.fillStyle = 'rgba(26, 26, 26, 0.15)';
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((item, i) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        const ratio = item.value / (item.max || 5);
        const x = cx + r * ratio * Math.cos(angle);
        const y = cy + r * ratio * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 数据点
      data.forEach((item, i) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        const ratio = item.value / (item.max || 5);
        const x = cx + r * ratio * Math.cos(angle);
        const y = cy + r * ratio * Math.sin(angle);

        ctx.fillStyle = item.color || '#1a1a1a';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    },

    drawLabels(ctx, cx, cy, r, count, data) {
      ctx.fillStyle = '#8e8e93';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      data.forEach((item, i) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        const labelR = r + 24;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);
        ctx.fillText(item.label, x, y);

        // 显示分数
        const scoreR = r - 16;
        const sx = cx + scoreR * Math.cos(angle);
        const sy = cy + scoreR * Math.sin(angle);
        ctx.fillStyle = item.color || '#1a1a1a';
        ctx.font = 'bold 11px -apple-system, sans-serif';
        ctx.fillText(String(item.value), sx, sy);
        ctx.fillStyle = '#8e8e93';
        ctx.font = '12px -apple-system, sans-serif';
      });
    },
  },
});
