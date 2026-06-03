// utils/constants.js

// 模块定义
const MODULES = {
  listening:  { key: 'listening',  label: '听力', icon: '🎧', color: '#007aff' },
  reading:    { key: 'reading',    label: '阅读', icon: '📖', color: '#34c759' },
  writing:    { key: 'writing',    label: '写作', icon: '✍️', color: '#ff9f0a' },
  translation:{ key: 'translation',label: '翻译', icon: '🔄', color: '#af52de' },
  vocabulary: { key: 'vocabulary', label: '词汇', icon: '📝', color: '#ff3b30' },
};

// 每日任务类型模板
const TASK_TEMPLATES = {
  listening_intensive: {
    type: 'listening',
    subtype: 'intensive',
    label: '听力精听',
    defaultDuration: 15,
    description: '五步法精听训练',
  },
  listening_shadow: {
    type: 'listening',
    subtype: 'shadow',
    label: '影子跟读',
    defaultDuration: 10,
    description: '模仿语音语调跟读',
  },
  reading_match: {
    type: 'reading',
    subtype: 'paragraph_match',
    label: '段落匹配',
    defaultDuration: 10,
    description: '三步法：读题→定位→找同义替换',
  },
  reading_careful: {
    type: 'reading',
    subtype: 'careful',
    label: '仔细阅读',
    defaultDuration: 15,
    description: '精读 + 同义替换识别',
  },
  translation_split: {
    type: 'translation',
    subtype: 'sentence_split',
    label: '翻译拆句',
    defaultDuration: 10,
    description: '拆主干→译主干→加修饰',
  },
  writing_skeleton: {
    type: 'writing',
    subtype: 'skeleton',
    label: '作文骨架',
    defaultDuration: 10,
    description: '模板骨架 + 高级替换',
  },
  word_new: {
    type: 'vocabulary',
    subtype: 'new_words',
    label: '新词学习',
    defaultDuration: 5,
    description: '今日新词',
  },
  word_review: {
    type: 'vocabulary',
    subtype: 'review',
    label: '单词复习',
    defaultDuration: 5,
    description: '艾宾浩斯到期词',
  },
};

// 信号词（听力关键提示词）
const SIGNAL_WORDS = {
  contrast:   ['but', 'however', 'although', 'though', 'nevertheless', 'yet', 'while', 'whereas', 'on the contrary', 'in contrast'],
  emphasis:   ['actually', 'in fact', 'as a matter of fact', 'indeed', 'certainly', 'the point is', 'what I mean is'],
  opinion:    ['I think', 'I believe', 'in my opinion', 'from my perspective', 'it seems to me'],
  conclusion: ['therefore', 'thus', 'consequently', 'as a result', 'so', 'in conclusion', 'to sum up'],
  cause:      ['because', 'since', 'due to', 'owing to', 'as a result of'],
  example:    ['for example', 'for instance', 'such as', 'like', 'take ... as an example'],
};

// 高级同义替换映射
const SYNONYM_REPLACEMENTS = [
  { basic: 'important',  advanced: ['crucial', 'vital', 'significant', 'essential', 'paramount', 'indispensable'] },
  { basic: 'think',      advanced: ['believe', 'argue', 'maintain', 'contend', 'hold the view that'] },
  { basic: 'many',       advanced: ['numerous', 'a host of', 'a multitude of', 'an array of', 'a variety of'] },
  { basic: 'because',    advanced: ['due to', 'owing to', 'on account of', 'given that', 'in light of'] },
  { basic: 'but',        advanced: ['however', 'nevertheless', 'nonetheless', 'on the other hand', 'conversely'] },
  { basic: 'very',       advanced: ['extremely', 'exceedingly', 'remarkably', 'profoundly', 'exceptionally'] },
  { basic: 'more and more', advanced: ['an increasing number of', 'a growing body of', 'ever-growing'] },
  { basic: 'good',       advanced: ['beneficial', 'advantageous', 'favorable', 'rewarding', 'constructive'] },
  { basic: 'bad',        advanced: ['detrimental', 'harmful', 'adverse', 'unfavorable', 'negative'] },
  { basic: 'help',       advanced: ['facilitate', 'promote', 'contribute to', 'foster', 'enhance'] },
];

// 文化热词库
const CULTURAL_TERMS = [
  { cn: '数字经济',           en: 'digital economy' },
  { cn: '碳中和',             en: 'carbon neutrality' },
  { cn: '新质生产力',         en: 'new quality productive forces' },
  { cn: '民营企业',           en: 'private enterprises' },
  { cn: '高质量发展',         en: 'high-quality development' },
  { cn: '共同富裕',           en: 'common prosperity' },
  { cn: '中国式现代化',       en: 'Chinese-style modernization' },
  { cn: '非物质文化遗产',     en: 'intangible cultural heritage' },
  { cn: '人工智能',           en: 'artificial intelligence' },
  { cn: '绿色转型',           en: 'green transformation' },
  { cn: '乡村振兴',           en: 'rural revitalization' },
  { cn: '一带一路',           en: 'the Belt and Road Initiative' },
  { cn: '工匠精神',           en: 'craftsmanship spirit' },
  { cn: '文化自信',           en: 'cultural confidence' },
  { cn: '人类命运共同体',     en: 'a community with a shared future for mankind' },
];

// 写作模板骨架
const WRITING_TEMPLATES = {
  argumentative: {
    name: '议论文',
    intro: 'Recently, the issue of [TOPIC] has aroused widespread concern. Views on this vary from person to person.',
    body1: 'Those who support [TOPIC] argue that [REASON1]. Moreover, [REASON2].',
    body2: 'However, opponents point out that [COUNTER1]. In addition, [COUNTER2].',
    conclusion: 'From my perspective, the advantages of [TOPIC] outweigh its drawbacks. [SUGGESTION].',
  },
  practical: {
    name: '应用文',
    intro: 'I am writing to [PURPOSE].',
    body: 'The reason why I [ACTION] is that [REASON]. Furthermore, [DETAIL].',
    conclusion: 'I would appreciate it if you could [REQUEST]. Looking forward to your reply.',
  },
  chart: {
    name: '图表作文',
    intro: 'As is vividly shown in the chart, [DESCRIPTION].',
    body: 'Several factors account for this phenomenon. To begin with, [CAUSE1]. Besides, [CAUSE2].',
    conclusion: 'From the analysis above, we can safely conclude that [TREND] will continue in the foreseeable future.',
  },
};

module.exports = {
  MODULES,
  TASK_TEMPLATES,
  SIGNAL_WORDS,
  SYNONYM_REPLACEMENTS,
  CULTURAL_TERMS,
  WRITING_TEMPLATES,
};
