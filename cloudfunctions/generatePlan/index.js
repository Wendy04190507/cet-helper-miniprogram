// cloudfunctions/generatePlan/index.js
// 生成每日学习计划 — 云函数远程版本
// 小程序本地已有 plan-engine.js 作离线生成，此云函数用于云端备份和跨设备同步
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function calculateWeights(selfEval) {
  const weights = {};
  let total = 0;
  Object.entries(selfEval || {}).forEach(([k, v]) => {
    weights[k] = 6 - (v || 3);
    total += weights[k];
  });
  if (total === 0) return { listening: 0.25, reading: 0.25, writing: 0.25, translation: 0.25 };
  Object.keys(weights).forEach(k => { weights[k] /= total; });
  return weights;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 如果传入 profile 直接用，否则查数据库
    let profile = event.profile;
    if (!profile) {
      const res = await db.collection('users').where({ _openid: openid }).get();
      if (res.data.length > 0) {
        profile = res.data[0];
      }
    }

    // 没有画像 → 返回默认计划
    if (!profile) {
      return {
        success: true,
        message: '使用默认画像生成计划（用户尚未完成入学评估）',
        plan: {
          date: todayStr(),
          remainingDays: 90,
          tasks: [
            { id: `${todayStr()}_word_new`, type: 'vocabulary', subtype: 'new_words', label: '新词学习', defaultDuration: 5, description: '今日10词', targetCount: 10 },
            { id: `${todayStr()}_word_review`, type: 'vocabulary', subtype: 'review', label: '单词复习', defaultDuration: 5, description: '艾宾浩斯到期词' },
            { id: `${todayStr()}_listening_0`, type: 'listening', subtype: 'intensive', label: '听力精听', defaultDuration: 15, description: '五步法精听训练' },
            { id: `${todayStr()}_reading_1`, type: 'reading', subtype: 'paragraph_match', label: '段落匹配', defaultDuration: 10, description: '三步法：定位→找同义替换' },
          ],
          totalMinutes: 35,
        },
        debug_info: { openid, profile_found: false },
      };
    }

    // 计算剩余天数
    const examDate = new Date(profile.examDate);
    const now = new Date();
    const remainingDays = Math.max(1, Math.ceil((examDate - now) / (1000 * 60 * 60 * 24)));

    const weights = calculateWeights(profile.selfEval);
    const minutes = parseInt(profile.dailyTime) || 30;
    const taskCount = minutes <= 15 ? 2 : minutes <= 30 ? 3 : minutes <= 60 ? 4 : 5;
    const newWordCount = minutes <= 15 ? 5 : minutes <= 30 ? 10 : minutes <= 60 ? 15 : 20;

    const ts = todayStr();
    const tasks = [
      { id: `${ts}_word_new`, type: 'vocabulary', subtype: 'new_words', label: '新词学习', defaultDuration: Math.ceil(newWordCount * 0.5), description: `今日${newWordCount}词`, targetCount: newWordCount },
      { id: `${ts}_word_review`, type: 'vocabulary', subtype: 'review', label: '单词复习', defaultDuration: 5, description: '艾宾浩斯到期词' },
    ];

    const sortedModules = Object.entries(weights).sort((a, b) => b[1] - a[1]);
    const templates = {
      listening: { type: 'listening', subtype: 'intensive', label: '听力精听', defaultDuration: 15, description: '五步法精听训练' },
      reading: { type: 'reading', subtype: 'paragraph_match', label: '段落匹配', defaultDuration: 10, description: '三步法：定位→找同义替换' },
      writing: { type: 'writing', subtype: 'skeleton', label: '作文骨架', defaultDuration: 10, description: '模板骨架 + 高级替换' },
      translation: { type: 'translation', subtype: 'sentence_split', label: '翻译拆句', defaultDuration: 10, description: '拆主干→译主干→加修饰' },
    };

    for (let i = 0; i < Math.max(0, taskCount - 2); i++) {
      const [modKey] = sortedModules[i % sortedModules.length];
      if (templates[modKey]) {
        tasks.push({ id: `${ts}_${modKey}_${i}`, ...templates[modKey], priority: weights[modKey] > 0.35 ? 'high' : 'normal' });
      }
    }

    const plan = {
      date: ts,
      remainingDays,
      tasks,
      totalMinutes: tasks.reduce((s, t) => s + t.defaultDuration, 0),
      isPreExam: remainingDays <= 30,
    };

    // 保存到云数据库（可选，失败不影响返回）
    try {
      await db.collection('daily_plans').add({
        data: { _openid: openid, ...plan, createdAt: db.serverDate() },
      });
    } catch (dbErr) {
      console.log('计划存储跳过:', dbErr.message);
    }

    return { success: true, plan, debug_info: { openid, remainingDays } };
  } catch (e) {
    console.error(e);
    return { success: false, message: e.message, stack: e.stack };
  }
};
