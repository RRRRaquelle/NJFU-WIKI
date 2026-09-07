# NJFU Wiki 双知识库导学助手 MVP

这是一个不依赖 Dify、支持规则基线和可配置大模型生成的双知识库 Web MVP。

它把两类知识分开使用：

- **竞赛政策库**：用于判断竞赛适配性、准备周期、能力要求、历史认定口径和风险提示。
- **NJFU-Courses 资料目录库**：用于返回真实资料名称、用途、使用阶段和 GitHub 原文件链接。

## MVP 主链路

1. 用户只给出模糊目标。
2. 系统提取年级、目标、现有基础、每周时间和组队情况。
3. 信息不足时只追问对选择有影响的信息。
4. 信息足够后，分别检索政策库和资料目录库。
5. 输出“适合方向 + 不选什么 + 时间尺度 + 能力缺口 + 首周行动 + 真实资料链接”。

## 当前演示场景

用户是大二学生，目标是保研，算法基础一般，做过 Packet Tracer，有两名同学，每周可投入 8 小时。系统会优先推荐 C4 网络技术挑战方向，并返回网络工程与组网实习的题目要求、任务书、评分标准、报告模板和教材。

## 本地运行

```bash
pnpm install
pnpm dev
```

## 更新知识索引

当上级目录中的竞赛 Markdown/CSV 或资料目录 Markdown 发生变化时，运行：

```bash
pnpm build:knowledge
```

生成脚本会重建 `app/data/knowledge.json`。当前索引包含 98 个政策块和 365 个资料记录。

## 第一轮评测

标准案例记录在 `evals/rag-eval-cases.jsonl`，bad case 总表记录在 `evals/badcases.jsonl`，分类说明位于 `evals/badcase-taxonomy.json`。

运行画像和检索基线：

```bash
pnpm eval:baseline
```

每次修改画像抽取或追问逻辑后运行：

```bash
pnpm eval:badcases
```

配置真实模型并启动站点后运行生成层评测：

```bash
pnpm eval:generation
```

当前评测覆盖专业方向同义表达、中文和小数时间、队伍关系、重复追问、双库召回、引用编号、行动结构与政策不确定性。

## 与大模型的关系

没有配置模型时，系统使用可解释规则和本地检索作为基线，不产生 Token 成本。配置 `.env.example` 中的三个服务端环境变量后，系统会把双库检索结果交给兼容 OpenAI Chat Completions 的模型生成带引用回答；接口异常时自动回退到规则基线。详细链路见 `docs/rag-v1-architecture.md`。
