// cloudfunctions/weeklyReport/index.js
// 生成周度学习报告
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function weekStartStr() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// 内置鼓励语池（无需 AI 也能用）
const ENCOURAGEMENTS = [
  '你的听力在慢慢变好，再坚持一周就能看到明显变化。',
  '这一周你做得很好，保持这个节奏，考试稳了。',
  '每一个单词都是通向高分的台阶，你正在积累复利。',
  '进步不是线性的，但你正在往对的方向走。',
  '学习是一场马拉松，你已经跑在了前面。',
  '不要小看每一天的积累，它们正在悄悄改变你。',
  '坚持本身就是一种胜利，继续加油！',
  '你比自己想象的更强大。',
];

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const ws = weekStartStr();
  const ts = todayStr();

  try {
    // 查询本周打卡（空表也不报错）
    let studyDays = 0;
    try {
      const r = await db.collection('check_ins')
        .where({ _openid: openid, date: db.command.gte(ws).and(db.command.lte(ts)) })
        .get();
      studyDays = r.data.length;
    } catch (e) { console.log('check_ins 查询跳过:', e.message); }

    // 查询任务记录
    let tasksDone = 0;
    let totalMinutes = 0;
    try {
      const r = await db.collection('task_records')
        .where({ _openid: openid, date: db.command.gte(ws).and(db.command.lte(ts)) })
        .get();
      tasksDone = r.data.length;
      totalMinutes = r.data.reduce((s, t) => s + (t.timeSpent || 0), 0);
    } catch (e) { console.log('task_records 查询跳过:', e.message); }

    // 查询新词
    let newWords = 0;
    try {
      const r = await db.collection('user_words').where({ _openid: openid }).count();
      newWords = r.total;
    } catch (e) { console.log('user_words 查询跳过:', e.message); }

    // 计算改善项（模拟，实际需历史对比）
    const improvements = [];
    if (studyDays >= 3) {
      improvements.push({ module: '打卡', before: '0天', after: `${studyDays}天`, up: true });
    }
    if (tasksDone > 0) {
      improvements.push({ module: '任务', before: '0项', after: `${tasksDone}项`, up: true });
    }
    if (newWords > 0) {
      improvements.push({ module: '单词', before: '0个', after: `${newWords}个`, up: true });
    }

    // 鼓励语 — 优先 AI，失败用内置
    let aiMessage = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && studyDays > 0) {
      try {
        const https = require('https');
        const prompt = `根据数据生成一句鼓励语(15字内中文)：${studyDays}天学习，${tasksDone}任务，${newWords}词。真诚不鸡汤。`;
        aiMessage = await new Promise((resolve, reject) => {
          const req = https.request({
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            timeout: 10000,
          }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
              try { resolve(JSON.parse(body).content[0].text.trim()); }
              catch { resolve(ENCOURAGEMENTS[0]); }
            });
          });
          req.on('error', () => resolve(ENCOURAGEMENTS[0]));
          req.on('timeout', () => { req.destroy(); resolve(ENCOURAGEMENTS[0]); });
          req.write(JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 100, messages: [{ role: 'user', content: prompt }] }));
          req.end();
        });
      } catch (e) { console.log('AI 鼓励语跳过:', e.message); }
    }

    const report = {
      _openid: openid,
      weekStart: ws,
      weekEnd: ts,
      stats: { studyDays, totalMinutes, newWords, tasksDone },
      improvements,
      aiMessage,
      createdAt: new Date(),
    };

    // 保存报告（可选）
    try {
      await db.collection('weekly_reports').add({ data: report });
    } catch (e) { console.log('报告存储跳过:', e.message); }

    return {
      success: true,
      report,
      debug_info: { openid, weekStart: ws, weekEnd: ts },
    };
  } catch (e) {
    console.error(e);
    return {
      success: true, // 即使出错也返回可用数据
      report: {
        weekStart: ws,
        weekEnd: ts,
        stats: { studyDays: 0, totalMinutes: 0, newWords: 0, tasksDone: 0 },
        improvements: [],
        aiMessage: ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)],
        notice: '数据加载部分失败，但报告已生成。开始学习后会越来越准。',
      },
    };
  }
};
