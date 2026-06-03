// cloudfunctions/aiCorrect/index.js
// AI 写作批改 + 翻译评估
// 支持两种模式：Claude API（需配环境变量）或本地规则引擎（默认）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 本地规则引擎 — 永远可用的基础批改
 */
function localWritingCheck(essay, topic) {
  const errors = [];
  const suggestions = [];
  const highlights = [];

  // 字数检查
  const wordCount = essay.split(/\s+/).filter(Boolean).length;
  if (wordCount < 80) {
    errors.push({ original: '-', correction: `字数不足：${wordCount}词（建议≥120词）`, explanation: '四六级作文要求120-180词' });
  } else {
    highlights.push('字数达标 ✓');
  }

  // 常见语法错误检查
  if (/\b(I|we|they|you|he|she)\s+is\b/i.test(essay)) {
    errors.push({ original: '主谓一致', correction: '检查主语和be动词的一致性', explanation: 'I am, he/she/it is, we/you/they are' });
  }

  if (/\bmore\s+\w+er\b/i.test(essay)) {
    errors.push({ original: '比较级重复', correction: '去掉 more 或去掉 -er', explanation: 'more better → better 或 much better' });
  }

  if (/\b(nowaday|now a days)\b/i.test(essay)) {
    errors.push({ original: 'nowaday', correction: 'nowadays', explanation: '拼写错误' });
  }

  // 高级替换建议
  const basicWords = {
    'important': 'crucial / vital / significant',
    'good': 'beneficial / advantageous',
    'bad': 'detrimental / harmful',
    'big': 'substantial / considerable',
    'many': 'numerous / a host of',
    'very': 'extremely / remarkably',
    'think': 'argue / maintain / contend',
  };

  Object.entries(basicWords).forEach(([basic, advanced]) => {
    const regex = new RegExp(`\\b${basic}\\b`, 'gi');
    if (regex.test(essay)) {
      suggestions.push({ original: basic, suggestion: advanced, reason: '使用高级词汇替换基础词汇可提分' });
    }
  });

  return {
    score: Math.min(15, Math.max(6, Math.round(wordCount / 10 + (highlights.length * 2) - errors.length * 0.5))),
    grammarErrors: errors.slice(0, 3),
    vocabularySuggestions: suggestions.slice(0, 3),
    logicIssues: [],
    overallComment: errors.length === 0 && wordCount >= 100
      ? '写得不错！结构清晰，继续保持。可以尝试更多高级句型和词汇。'
      : '基础不错，注意纠正上面的小错误，多写多练就会越来越好。',
    highlights: highlights.length > 0 ? highlights : ['完成了写作练习 ✓'],
  };
}

function localTranslationCheck(englishTranslation) {
  return {
    score: 10,
    isBlank: !englishTranslation || englishTranslation.trim().length === 0,
    grammarErrors: [],
    chinglishIssues: [],
    vocabularyIssues: [],
    overallComment: '翻译提交成功！开通 AI 批改后可获得更详细的分析。',
    keyImprovement: '多注意中英文语序差异',
  };
}

exports.main = async (event, context) => {
  const { type, content, topic } = event || {};

  try {
    // 优先使用 Claude API（如果配置了密钥）
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey && type && content) {
      // 尝试 AI 批改
      try {
        const https = require('https');
        let prompt;
        if (type === 'writing') {
          prompt = `批改这篇英语作文（topic: ${topic || '通用'}）。以JSON返回：{"score":预估0-15分,"grammarErrors":[{"original":"原文","correction":"修正"}],"vocabularySuggestions":[{"original":"原词","suggestion":"替换"}],"overallComment":"评价(中文)","highlights":["优点"]}\n\n作文：${content}`;
        } else {
          prompt = `评估这段翻译。以JSON返回：{"score":0-15分,"grammarErrors":[{"error":"","correction":""}],"chinglishIssues":[{"original":"","suggestion":""}],"overallComment":"评价(中文)","keyImprovement":"最需改进点"}\n\n原文：${topic}\n翻译：${content}`;
        }

        const aiResult = await new Promise((resolve, reject) => {
          const req = https.request({
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            timeout: 15000,
          }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
              try {
                const text = JSON.parse(body).content[0].text;
                // 提取 JSON
                const match = text.match(/\{[\s\S]*\}/);
                resolve(match ? JSON.parse(match[0]) : JSON.parse(text));
              } catch (e) { reject(e); }
            });
          });
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
          req.write(JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
          }));
          req.end();
        });

        return { success: true, result: aiResult, engine: 'ai' };
      } catch (aiErr) {
        console.log('AI 调用失败，回退到本地引擎:', aiErr.message);
      }
    }

    // 本地引擎（始终可用）
    let result;
    if (type === 'writing') {
      result = localWritingCheck(content || '', topic || '');
    } else if (type === 'translation') {
      result = localTranslationCheck(content || '');
    } else {
      // 无参数测试调用
      return {
        success: true,
        message: 'AI 批改云函数运行正常。在云函数环境变量中设置 ANTHROPIC_API_KEY 即可启用 AI 批改。',
        modes: ['writing', 'translation'],
        usage: { writing: '传入 { type: "writing", content: "作文内容", topic: "题目" }', translation: '传入 { type: "translation", content: "翻译内容", topic: "原文" }' },
      };
    }

    return { success: true, result, engine: 'local' };
  } catch (e) {
    console.error(e);
    return { success: false, message: e.message };
  }
};
