// cloudfunctions/generatePlan/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { userId } = event;
  const wxContext = cloud.getWXContext();

  try {
    // 获取用户画像
    const userRes = await db.collection('users')
      .where({ _openid: wxContext.OPENID })
      .get();

    if (userRes.data.length === 0) {
      return { success: false, message: '未找到用户画像' };
    }

    const profile = userRes.data[0];

    // 计算剩余天数
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const examDate = new Date(profile.examDate);
    const remainingDays = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

    // 计算模块权重（短板优先）
    const weights = {};
    let totalWeight = 0;
    Object.entries(profile.selfEval).forEach(([mod, score]) => {
      weights[mod] = 6 - score;
      totalWeight += weights[mod];
    });
    Object.keys(weights).forEach(mod => {
      weights[mod] = weights[mod] / totalWeight;
    });

    // 根据用时确定任务数
    const minutes = parseInt(profile.dailyTime) || 30;
    let taskCount = minutes <= 15 ? 2 : minutes <= 30 ? 3 : minutes <= 60 ? 4 : 5;
    let newWordCount = minutes <= 15 ? 5 : minutes <= 30 ? 10 : minutes <= 60 ? 15 : 20;

    const isPreExam = remainingDays <= 30;

    // 生成任务
    const tasks = [
      {
        id: `${todayStr}_word_new`,
        type: 'vocabulary',
        subtype: 'new_words',
        label: '新词学习',
        defaultDuration: Math.ceil(newWordCount * 0.5),
        description: `今日${newWordCount}词`,
        targetCount: newWordCount,
      },
      {
        id: `${todayStr}_word_review`,
        type: 'vocabulary',
        subtype: 'review',
        label: '单词复习',
        defaultDuration: 5,
        description: '艾宾浩斯到期词',
      },
    ];

    const sortedModules = Object.entries(weights).sort((a, b) => b[1] - a[1]);
    const taskTemplates = {
      listening:    { type: 'listening',    subtype: 'intensive', label: '听力精听',       defaultDuration: 15, description: '五步法精听训练' },
      reading:      { type: 'reading',      subtype: 'paragraph_match', label: '段落匹配',  defaultDuration: 10, description: '三步法：定位→找同义替换' },
      writing:      { type: 'writing',      subtype: 'skeleton', label: '作文骨架',         defaultDuration: 10, description: '模板骨架 + 高级替换' },
      translation:  { type: 'translation', substype: 'sentence_split', label: '翻译拆句',   defaultDuration: 10, description: '拆主干→译主干→加修饰' },
    };

    for (let i = 0; i < taskCount - 2; i++) {
      const modIdx = i % sortedModules.length;
      const [modKey] = sortedModules[modIdx];
      if (taskTemplates[modKey]) {
        tasks.push({
          id: `${todayStr}_${modKey}_${i}`,
          ...taskTemplates[modKey],
          priority: weights[modKey] > 0.35 ? 'high' : 'normal',
        });
      }
    }

    const totalMinutes = tasks.reduce((sum, t) => sum + t.defaultDuration, 0);

    const plan = {
      date: todayStr,
      remainingDays,
      tasks,
      totalMinutes,
      isPreExam,
    };

    // 保存到云数据库
    await db.collection('daily_plans').add({
      data: {
        _openid: wxContext.OPENID,
        ...plan,
        createdAt: db.serverDate(),
      },
    });

    return { success: true, plan };
  } catch (e) {
    console.error(e);
    return { success: false, message: e.message };
  }
};
