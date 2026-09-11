# NJFU Wiki MVP

NJFU Wiki 是一个面向南京林业大学学生的资料发现与个人发展导学 MVP。界面来自 Figma Make，AI 对话由本地双知识库检索、用户画像规则和可选大模型生成共同驱动。

## 当前能力

- Figma Make 首页、发现、收藏、贡献、个人页交互。
- 竞赛政策库：98 个检索块。
- NJFU-Courses 资料目录库：365 条真实 GitHub 资料记录。
- 连续对话画像：年级、目标、基础、时间预算和组队情况。
- 信息不足时确定性追问，避免重复询问已提供字段。
- 推荐结果包含适配理由、取舍、准备尺度、行动步骤和 P/R 证据。
- 未配置模型或模型失败时自动回退到规则基线。

## 本地运行

环境要求：Node.js 22.13 或更高版本、pnpm。

```bash
pnpm install
pnpm dev
```

打开终端中显示的本地地址。未配置模型时，完整 UI、画像和双库检索仍然可以运行。

## 接入 DeepSeek

复制环境变量模板：

```bash
cp .env.example .env.local
```

然后只在 `.env.local` 中填写：

```env
LLM_API_BASE_URL=https://api.deepseek.com
LLM_API_KEY=你的服务端密钥
LLM_MODEL=DeepSeek 控制台当前可用的模型 ID
```

`.env.local` 已被 Git 忽略。不要使用 `NEXT_PUBLIC_` 前缀，否则密钥会进入浏览器代码。

## 更新知识索引

当上级目录中的竞赛 Markdown/CSV 或资料目录发生变化时运行：

```bash
pnpm build:knowledge
```

生成结果为 `app/data/knowledge.json`。

## 验证

```bash
pnpm build
pnpm eval:baseline
pnpm eval:badcases
```

配置真实模型并启动本地服务后，再运行：

```bash
pnpm eval:generation
```

标准案例位于 `evals/rag-eval-cases.jsonl`，bad case 总表位于 `evals/badcases.jsonl`。

## GitHub 与 Vercel

1. 将本目录作为 GitHub 仓库根目录。
2. 在 Vercel 中导入该仓库；框架选择 Next.js。
3. 在 Vercel 项目设置中添加 `LLM_API_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL`。
4. 先验收 Preview Deployment，再将主分支发布到 Production。

构建命令使用 `pnpm build`，不需要提交 `.env.local`、`.next` 或 `node_modules`。

## MVP 边界

- 登录、收藏和贡献目前只保存于浏览器会话或本地状态，不是正式账号系统。
- 课程资料由 NJFU-CS/NJFU-Courses 托管，本项目保存的是目录和链接，不复制原文件。
- 竞赛、综测和推免信息必须以当届学校及学院正式文件为准。
