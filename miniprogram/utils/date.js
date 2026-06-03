// utils/date.js

/**
 * 获取今日日期字符串 YYYY-MM-DD
 */
function today() {
  const d = new Date();
  return formatDate(d);
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 计算两个日期之间的天数差
 */
function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * 给日期加 N 天
 */
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

/**
 * 获取本周起始日期（周一）
 */
function weekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // 周日视为上周最后一天
  d.setDate(d.getDate() - diff);
  return formatDate(d);
}

/**
 * 获取本月第一天
 */
function monthStart() {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

/**
 * 获取本月最后一天
 */
function monthEnd() {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

/**
 * CET 默认考试日期（每年6月和12月第二个周六）
 */
function getDefaultExamDate() {
  const now = new Date();
  const year = now.getFullYear();
  // 6月第二个周六
  const junFirst = new Date(year, 5, 1);
  const junSecondSat = new Date(year, 5, 1 + ((6 - junFirst.getDay() + 7) % 7) + 7);
  // 12月第二个周六
  const decFirst = new Date(year, 11, 1);
  const decSecondSat = new Date(year, 11, 1 + ((6 - decFirst.getDay() + 7) % 7) + 7);

  if (now < junSecondSat) return formatDate(junSecondSat);
  if (now < decSecondSat) return formatDate(decSecondSat);
  // 如果今年两次都过了，返回明年6月
  const nextJunFirst = new Date(year + 1, 5, 1);
  const nextJunSecondSat = new Date(year + 1, 5, 1 + ((6 - nextJunFirst.getDay() + 7) % 7) + 7);
  return formatDate(nextJunSecondSat);
}

module.exports = {
  today,
  formatDate,
  daysBetween,
  addDays,
  weekStart,
  monthStart,
  monthEnd,
  getDefaultExamDate,
};
