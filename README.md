# CET Helper · 四六级备考助手

微信小程序 + Web 双端四六级备考应用。

## 已配置

| 项目 | 值 |
|------|-----|
| AppID | `wx82c57008b97170b4` |
| 云环境 | `cloud1-d0guf7km850442629` |
| 基础库 | 3.3.4+ |

## 在微信开发者工具中打开

1. 打开微信开发者工具
2. 导入项目 → 选择 `cet-helper/` 目录
3. AppID 已自动填入

## 云函数部署（按顺序！）

1. 先上传 **initDB**：右键 `cloudfunctions/initDB` → 「上传并部署：云端安装依赖」
2. 在开发者工具顶部点击「云开发」→「云函数」→ 找到 `initDB` → 点击「测试」→ 看到返回 `"success": true`
3. 上传其余 3 个云函数：右键 `cloudfunctions/generatePlan`、`aiCorrect`、`weeklyReport` 逐一上传

## 创建数据库集合

initDB 云函数执行后会自动创建以下集合：
- `users` — 用户画像
- `daily_plans` — 每日计划
- `task_records` — 任务记录
- `check_ins` — 打卡记录
- `user_words` — 用户单词本
- `weekly_reports` — 周报
- `word_bank` — 词库（含 50 个种子高频词）
- `online_users` — 在线用户

## 注意事项

- `app.js` 已配置为本地优先模式 — 即使云开发出错也不影响基础功能
- AI 批改功能需要配置 `ANTHROPIC_API_KEY` 环境变量（云开发控制台 → 云函数 → aiCorrect → 环境变量）

## Web 版

Web 版已部署在：https://wendy04190507.github.io/cet-helper-web/
