// cloudfunctions/aiCorrect/index.js
// AI 写作批改 + 翻译评估（通过 Claude API）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 调用 Claude API 进行文本批改
 * ANTHROPIC_API_KEY 在云函数环境变量中配置
 */
async function callClaude(prompt, maxTokens = 1024) {
  const response = await cloud.openapi.cloudbase.callFunction
    ? null : null; // 占位：实际通过 https 请求 Claude API

  // 实际实现：
  const https = require('https');
  const apiKey = process.env.ANTHROPIC_API_KEY;

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

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
          const json = JSON.parse(body);
          resolve(json.content[0].text);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 写作批改 prompt
 */
function buildWritingPrompt(essay, topic) {
  return `你是一位四六级英语写作批改老师。请对下面的学生作文进行批改，topic: "${topic}"。

作文：
${essay}

请以 JSON 格式返回批改结果：
{
  "score": 0-15的预估分,
  "grammarErrors": [{"original": "错误原文", "correction": "修正", "explanation": "解释"}],
  "vocabularySuggestions": [{"original": "原词", "suggestion": "更高级替换", "reason": "理由"}],
  "logicIssues": [{"description": "逻辑问题"}],
  "overallComment": "总体评价（中文，鼓励性语气）",
  "highlights": ["做得好的地方1", "做得好的地方2"]
}`;
}

/**
 * 翻译评估 prompt
 */
function buildTranslationPrompt(chineseText, englishTranslation) {
  return `你是一位四六级翻译批改老师。请评估下面的翻译。

中文原文：${chineseText}
学生翻译：${englishTranslation}

以 JSON 返回：
{
  "score": 0-15的预估分,
  "isBlank": false,
  "grammarErrors": [{"error": "错误", "correction": "修正"}],
  "chinglishIssues": [{"original": "中式表达", "suggestion": "地道的说法"}],
  "vocabularyIssues": [{"word": "词汇", "suggestion": "更准确的词"}],
  "overallComment": "总体评价（中文，鼓励性语气）",
  "keyImprovement": "最需要改进的一个点"
}`;
}

exports.main = async (event) => {
  const { type, content, topic } = event;

  try {
    let prompt, result;

    if (type === 'writing') {
      prompt = buildWritingPrompt(content, topic || '');
      const response = await callClaude(prompt);
      result = JSON.parse(response);
    } else if (type === 'translation') {
      prompt = buildTranslationPrompt(content, topic || '');
      const response = await callClaude(prompt);
      result = JSON.parse(response);
    } else {
      return { success: false, message: '不支持的类型' };
    }

    return { success: true, result };
  } catch (e) {
    console.error(e);
    return { success: false, message: e.message };
  }
};
