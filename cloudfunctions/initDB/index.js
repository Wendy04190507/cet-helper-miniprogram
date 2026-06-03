// cloudfunctions/initDB/index.js
// 首次启动时运行此云函数，自动创建所有数据库集合和索引
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTIONS = [
  {
    name: 'users',
    description: '用户画像',
    indexes: [{ field: '_openid', unique: true }],
  },
  {
    name: 'daily_plans',
    description: '每日学习计划',
    indexes: [
      { field: '_openid' },
      { field: 'date' },
    ],
  },
  {
    name: 'task_records',
    description: '任务执行记录',
    indexes: [
      { field: '_openid' },
      { field: 'date' },
    ],
  },
  {
    name: 'check_ins',
    description: '打卡记录',
    indexes: [
      { field: '_openid' },
      { field: 'date' },
    ],
  },
  {
    name: 'user_words',
    description: '用户单词本',
    indexes: [
      { field: '_openid' },
      { field: 'wordId' },
    ],
  },
  {
    name: 'weekly_reports',
    description: '周度报告',
    indexes: [
      { field: '_openid' },
      { field: 'weekStart' },
    ],
  },
  {
    name: 'word_bank',
    description: '系统词库（四六级高频词）',
    indexes: [
      { field: 'word' },
      { field: 'level' },
      { field: 'frequency' },
    ],
  },
  {
    name: 'online_users',
    description: '实时在线用户（Study With Me）',
    indexes: [
      { field: '_openid', unique: true },
      { field: 'lastActive' },
    ],
  },
];

// 种子词库 — 四六级高频词
const SEED_WORDS = [
  { word: 'abandon', phonetic: '/əˈbændən/', meaning: '放弃；抛弃', example: 'He abandoned his plan and left the city.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['give up', 'desert', 'forsake'] },
  { word: 'inevitable', phonetic: '/ɪnˈevɪtəbl/', meaning: '不可避免的', example: 'Change is inevitable in modern society.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['unavoidable', 'inescapable', 'bound to happen'] },
  { word: 'significant', phonetic: '/sɪɡˈnɪfɪkənt/', meaning: '重要的；显著的', example: 'This is a significant discovery in medicine.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['crucial', 'vital', 'important', 'notable'] },
  { word: 'approach', phonetic: '/əˈprəʊtʃ/', meaning: '方法；接近', example: 'We need a new approach to this problem.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['method', 'technique', 'strategy'] },
  { word: 'consequence', phonetic: '/ˈkɒnsɪkwəns/', meaning: '后果；结果', example: 'The consequences of climate change are severe.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['result', 'outcome', 'aftermath'] },
  { word: 'acquire', phonetic: '/əˈkwaɪə(r)/', meaning: '获得；习得', example: 'She acquired valuable skills during the internship.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['obtain', 'gain', 'attain'] },
  { word: 'phenomenon', phonetic: '/fɪˈnɒmɪnən/', meaning: '现象', example: 'This phenomenon has attracted global attention.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['occurrence', 'event', 'incident'] },
  { word: 'sufficient', phonetic: '/səˈfɪʃnt/', meaning: '足够的', example: 'The evidence is not sufficient to prove his guilt.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['adequate', 'enough', 'ample'] },
  { word: 'controversy', phonetic: '/ˈkɒntrəvɜːsi/', meaning: '争议', example: 'The issue has caused great controversy.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['dispute', 'debate', 'disagreement'] },
  { word: 'domestic', phonetic: '/dəˈmestɪk/', meaning: '国内的；家庭的', example: 'Domestic tourism has grown rapidly in recent years.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['internal', 'national', 'household'] },
  { word: 'promote', phonetic: '/prəˈməʊt/', meaning: '促进；推广', example: 'We should promote cultural exchange between nations.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['facilitate', 'encourage', 'advance'] },
  { word: 'accelerate', phonetic: '/əkˈseləreɪt/', meaning: '加速', example: 'Technology accelerates the pace of social change.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'medium', synonyms: ['speed up', 'quicken', 'hasten'] },
  { word: 'fundamental', phonetic: '/ˌfʌndəˈmentl/', meaning: '基础的；根本的', example: 'This is a fundamental principle of physics.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['basic', 'essential', 'primary'] },
  { word: 'diverse', phonetic: '/daɪˈvɜːs/', meaning: '多样的', example: 'A diverse range of opinions was expressed at the meeting.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['various', 'varied', 'multiple'] },
  { word: 'comprehensive', phonetic: '/ˌkɒmprɪˈhensɪv/', meaning: '全面的', example: 'We conducted a comprehensive review of the policy.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['thorough', 'complete', 'extensive'] },
  { word: 'perspective', phonetic: '/pəˈspektɪv/', meaning: '视角；观点', example: 'From a different perspective, this decision makes sense.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['viewpoint', 'standpoint', 'outlook'] },
  { word: 'sustainable', phonetic: '/səˈsteɪnəbl/', meaning: '可持续的', example: 'Sustainable development is our common goal.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['maintainable', 'viable', 'enduring'] },
  { word: 'innovation', phonetic: '/ˌɪnəˈveɪʃn/', meaning: '创新', example: 'Innovation drives economic growth and social progress.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['creativity', 'invention', 'breakthrough'] },
  { word: 'challenge', phonetic: '/ˈtʃælɪndʒ/', meaning: '挑战', example: 'Climate change is a global challenge requiring collective action.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['difficulty', 'obstacle', 'test'] },
  { word: 'access', phonetic: '/ˈækses/', meaning: '进入；获取', example: 'Everyone should have access to quality education.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['entry', 'admission', 'approach'] },
  { word: 'efficient', phonetic: '/ɪˈfɪʃnt/', meaning: '高效的', example: 'The new system is more efficient and saves time.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['effective', 'productive', 'competent'] },
  { word: 'contribute', phonetic: '/kənˈtrɪbjuːt/', meaning: '贡献；有助于', example: 'Regular exercise contributes to better health.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['donate', 'provide', 'add to'] },
  { word: 'flexible', phonetic: '/ˈfleksəbl/', meaning: '灵活的；有弹性的', example: 'A flexible schedule allows for better work-life balance.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'medium', synonyms: ['adaptable', 'adjustable', 'versatile'] },
  { word: 'potential', phonetic: '/pəˈtenʃl/', meaning: '潜力；潜在的', example: 'The student shows great potential in mathematics.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['capability', 'capacity', 'promise'] },
  { word: 'relevant', phonetic: '/ˈreləvənt/', meaning: '相关的', example: 'The information you provided is highly relevant.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'medium', synonyms: ['pertinent', 'applicable', 'germane'] },
  { word: 'struggle', phonetic: '/ˈstrʌɡl/', meaning: '挣扎；奋斗', example: 'Many students struggle with English listening comprehension.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['strive', 'fight', 'endeavor'] },
  { word: 'temporary', phonetic: '/ˈtemprəri/', meaning: '暂时的', example: 'This is only a temporary solution to the problem.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'medium', synonyms: ['transient', 'short-term', 'provisional'] },
  { word: 'ultimate', phonetic: '/ˈʌltɪmət/', meaning: '最终的；根本的', example: 'The ultimate goal is to improve student performance.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'medium', synonyms: ['final', 'eventual', 'supreme'] },
  { word: 'vulnerable', phonetic: '/ˈvʌlnərəbl/', meaning: '脆弱的；易受伤害的', example: 'Children are particularly vulnerable to online dangers.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['sensitive', 'defenseless', 'exposed'] },
  { word: 'widespread', phonetic: '/ˈwaɪdspred/', meaning: '广泛的', example: 'The use of smartphones is now widespread among teenagers.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['prevalent', 'ubiquitous', 'extensive'] },
  { word: 'acknowledge', phonetic: '/əkˈnɒlɪdʒ/', meaning: '承认；认可', example: 'He acknowledged his mistake and apologized sincerely.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['admit', 'recognize', 'accept'] },
  { word: 'circumstance', phonetic: '/ˈsɜːkəmstəns/', meaning: '环境；情况', example: 'Under no circumstances should you give up on your dreams.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['condition', 'situation', 'context'] },
  { word: 'demonstrate', phonetic: '/ˈdemənstreɪt/', meaning: '展示；证明', example: 'The experiment demonstrates the effectiveness of the drug.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['show', 'illustrate', 'prove'] },
  { word: 'enhance', phonetic: '/ɪnˈhɑːns/', meaning: '增强；提高', example: 'Reading extensively can enhance your vocabulary significantly.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['improve', 'boost', 'strengthen'] },
  { word: 'infrastructure', phonetic: '/ˈɪnfrəstrʌktʃə(r)/', meaning: '基础设施', example: 'The government invested heavily in transportation infrastructure.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['framework', 'foundation', 'facilities'] },
  { word: 'justify', phonetic: '/ˈdʒʌstɪfaɪ/', meaning: '证明……正当', example: 'Nothing can justify violence against innocent people.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'medium', synonyms: ['defend', 'vindicate', 'validate'] },
  { word: 'maintain', phonetic: '/meɪnˈteɪn/', meaning: '保持；维护', example: 'It is important to maintain a healthy lifestyle.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['keep', 'preserve', 'sustain'] },
  { word: 'negotiate', phonetic: '/nɪˈɡəʊʃieɪt/', meaning: '谈判；协商', example: 'The two companies are negotiating a merger deal.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'medium', synonyms: ['bargain', 'discuss', 'mediate'] },
  { word: 'obstacle', phonetic: '/ˈɒbstəkl/', meaning: '障碍', example: 'Lack of funding is the main obstacle to our project.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'medium', synonyms: ['barrier', 'hurdle', 'impediment'] },
  { word: 'profound', phonetic: '/prəˈfaʊnd/', meaning: '深远的；深刻的', example: 'The pandemic has had a profound impact on society.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['deep', 'significant', 'intense'] },
  { word: 'reluctant', phonetic: '/rɪˈlʌktənt/', meaning: '不情愿的', example: 'She was reluctant to share her personal information.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'medium', synonyms: ['unwilling', 'hesitant', 'disinclined'] },
  { word: 'transform', phonetic: '/trænsˈfɔːm/', meaning: '改变；转变', example: 'Technology has transformed the way we communicate.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['change', 'convert', 'alter'] },
  { word: 'undergo', phonetic: '/ˌʌndəˈɡəʊ/', meaning: '经历', example: 'The city has undergone dramatic changes in the past decade.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'medium', synonyms: ['experience', 'endure', 'go through'] },
  { word: 'yield', phonetic: '/jiːld/', meaning: '产生；产出', example: 'Hard work will yield positive results in the long run.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'medium', synonyms: ['produce', 'generate', 'result in'] },
  { word: 'address', phonetic: '/əˈdres/', meaning: '处理；发表演说', example: 'We need to address this issue urgently.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['tackle', 'handle', 'deal with'] },
  { word: 'bias', phonetic: '/ˈbaɪəs/', meaning: '偏见；偏心', example: 'News reporting should be free from political bias.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'medium', synonyms: ['prejudice', 'inclination', 'partiality'] },
  { word: 'commodity', phonetic: '/kəˈmɒdəti/', meaning: '商品', example: 'Oil is one of the most traded commodities in the world.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'medium', synonyms: ['product', 'goods', 'merchandise'] },
  { word: 'dilemma', phonetic: '/dɪˈlemə/', meaning: '困境；进退两难', example: 'The government faces a dilemma between growth and the environment.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'high', synonyms: ['predicament', 'quandary', 'plight'] },
  { word: 'eliminate', phonetic: '/ɪˈlɪmɪneɪt/', meaning: '消除', example: 'We must eliminate discrimination in all its forms.', exampleSource: 'CET-4 真题', level: 'cet4', frequency: 'high', synonyms: ['remove', 'eradicate', 'get rid of'] },
  { word: 'flourish', phonetic: '/ˈflʌrɪʃ/', meaning: '繁荣；茂盛', example: 'Small businesses flourish in a competitive market environment.', exampleSource: 'CET-6 真题', level: 'cet6', frequency: 'medium', synonyms: ['thrive', 'prosper', 'blossom'] },
];

exports.main = async (event) => {
  const results = { collections: [], words: 0, errors: [] };

  for (const coll of COLLECTIONS) {
    try {
      // 尝试在集合中插入一条临时数据来触发集合创建
      // 云开发集合在首次使用时自动创建
      const tempData = {
        _init: true,
        createdAt: db.serverDate(),
      };
      await db.collection(coll.name).add({ data: tempData });
      results.collections.push(`${coll.name} ✅`);
    } catch (e) {
      // 集合可能已存在
      if (e.errCode === -502005) {
        // 集合已存在
        results.collections.push(`${coll.name} (已存在)`);
      } else {
        results.errors.push(`${coll.name}: ${e.message}`);
        results.collections.push(`${coll.name} ❌ ${e.message}`);
      }
    }
  }

  // 导入种子词库到 word_bank 集合
  try {
    // 先检查词库是否已有数据
    const countRes = await db.collection('word_bank').count();
    if (countRes.total < 10) {
      for (const word of SEED_WORDS) {
        await db.collection('word_bank').add({ data: word });
      }
      results.words = SEED_WORDS.length;
    } else {
      results.words = `已有 ${countRes.total} 词，跳过导入`;
    }
  } catch (e) {
    results.errors.push(`word_bank导入: ${e.message}`);
  }

  return {
    success: true,
    environment: cloud.DYNAMIC_CURRENT_ENV,
    message: '云开发初始化完成',
    collections_created: results.collections,
    words_imported: results.words,
    errors: results.errors,
    timestamp: new Date().toISOString(),
  };
};
