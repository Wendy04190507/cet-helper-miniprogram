// utils/storage.js

const CACHE_PREFIX = 'cet_';
const CACHE_KEYS = {
  USER_PROFILE:  'user_profile',
  TODAY_PLAN:    'today_plan',
  WORD_BANK:     'word_bank',
  USER_WORDS:    'user_words',
  CHECK_INS:     'check_ins',
  TASK_RECORDS:  'task_records',
  SETTINGS:      'settings',
};

/**
 * 读缓存
 */
function get(key, defaultValue = null) {
  try {
    const value = wx.getStorageSync(CACHE_PREFIX + key);
    return value !== '' ? value : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * 写缓存
 */
function set(key, value) {
  try {
    wx.setStorageSync(CACHE_PREFIX + key, value);
  } catch (e) {
    console.error('缓存写入失败:', key, e);
  }
}

/**
 * 删除缓存
 */
function remove(key) {
  try {
    wx.removeStorageSync(CACHE_PREFIX + key);
  } catch (e) {
    console.error('缓存删除失败:', key, e);
  }
}

/**
 * 清除所有 CET 相关缓存
 */
function clearAll() {
  try {
    const info = wx.getStorageInfoSync();
    info.keys.forEach(k => {
      if (k.startsWith(CACHE_PREFIX)) {
        wx.removeStorageSync(k);
      }
    });
  } catch (e) {
    console.error('缓存清除失败:', e);
  }
}

module.exports = {
  CACHE_KEYS,
  get,
  set,
  remove,
  clearAll,
};
