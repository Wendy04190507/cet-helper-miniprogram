// components/progress-bar/progress-bar.js
Component({
  properties: {
    completed: { type: Number, value: 0 },
    total:     { type: Number, value: 4 },
    color:     { type: String, value: '#1a1a1a' },
    label:     { type: String, value: '' },
    showLabel: { type: Boolean, value: true },
  },
  computed: {
    percent() {
      if (this.properties.total === 0) return 0;
      return Math.min(100, Math.round((this.properties.completed / this.properties.total) * 100));
    },
  },
});
