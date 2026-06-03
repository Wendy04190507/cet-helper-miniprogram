// cloudfunctions/weeklyReport/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 调用 Claude API 生成鼓励语
 */
async function generateEncouragement(stats) {
  const https = require('https');
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const prompt = `你是一位温暖的四六级备考导师。根据以下学习数据，生成一句个性化鼓励语（20字以内，中文）：

学习天数：${stats.studyDays}
总学习时间：${stats.totalMinutes}分钟
新单词：${stats.newWords}
完成任务：${stats.tasksDone}

鼓励语要真诚、具体、不鸡汤。`;

  const data = JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body).content[0].text);
        } catch (e) {
          resolve('坚持就是胜利，每一次努力都在积累。');
        }
      });
    });
    req.on('error', () => resolve('保持这个节奏，你会看到改变的。'));
    req.write(data);
    req.end();
  });
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();

  try {
    // 计算本周起止
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const weekStart = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    // 获取本周打卡记录
    const checkinsRes = await db.collection('check_ins')
      .where({
        _openid: wxContext.OPENID,
        date: db.command.gte(weekStart).and(db.command.lte(todayStr)),
      })
      .get();

    const studyDays = checkinsRes.data.length;

    // 获取本周任务记录
    const taskRes = await db.collection('task_records')
      .where({
        _openid: wxContext.OPENID,
        date: db.command.gte(weekStart).and(db.command.lte(todayStr)),
      })
      .get();

    const tasksDone = taskRes.data.length;
    const totalMinutes = taskRes.data.reduce((s, t) => s + (t.timeSpent || 0), 0);

    // 获取本周新学单词
    const wordsRes = await db.collection('user_words')
      .where({
        _openid: wxContext.OPENID,
        createdAt: db.command.gte(weekStart).and(db.command.lte(todayStr)),
      })
      .count();

    const newWords = wordsRes.total;

    const stats = { studyDays, totalMinutes, newWords, tasksDone };

    // 调用 AI 生成鼓励语
    const encouragement = await generateEncouragement(stats);

    // 保存报告
    const report = {
      _openid: wxContext.OPENID,
      weekStart,
      weekEnd: todayStr,
      stats,
      aiMessage: encouragement,
      createdAt: db.serverDate(),
    };

    await db.collection('weekly_reports').add({ data: report });

    return { success: true, report };
  } catch (e) {
    console.error(e);
    return { success: false, message: e.message };
  }
};
