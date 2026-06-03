// components/task-card/task-card.js
Component({
  properties: {
    taskId:    { type: String, value: '' },
    icon:      { type: String, value: '📝' },
    label:     { type: String, value: '' },
    duration:  { type: Number, value: 10 },
    description: { type: String, value: '' },
    source:    { type: String, value: '' },
    completed: { type: Boolean, value: false },
  },
  methods: {
    onToggle() {
      this.triggerEvent('toggle', {
        taskId: this.properties.taskId,
        completed: !this.properties.completed,
      });
    },
  },
});
