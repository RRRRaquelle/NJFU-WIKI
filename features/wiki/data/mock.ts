import type { AssistantReply } from "@/lib/assistant-engine";

export interface ResourceItem {
  id: string;
  type: "课程" | "竞赛" | "升学" | "就业" | "经验" | "路线";
  title: string;
  summary: string;
  tags: string[];
  stage: string;
  updatedAt: string;
  contributor: string;
  isSaved: boolean;
  fullText?: string;
  sourceUrl?: string;
}

export interface Folder {
  id: string;
  name: string;
  itemIds: string[];
}

export interface MockUser {
  name: string;
  avatarColor: string;
  dept: string;
  grade: string;
  bio: string;
  points: number;
  aiProfile: string[];
  contributionIds: string[];
}

export interface ChatTurn {
  role: "user" | "ai";
  content: string;
  recommendationIds?: string[];
  reply?: AssistantReply;
}

export const resources: ResourceItem[] = [
  {
    id: "r1",
    type: "路线",
    title: "计算机大一新生学习路线图",
    summary: "从零开始，系统梳理大一阶段应掌握的编程基础与工具链，帮助新生少走弯路，建立清晰的学习节奏。",
    tags: ["入门", "大一", "编程基础", "工具链"],
    stage: "大一",
    updatedAt: "2026-06-15",
    contributor: "张明远",
    isSaved: true,
    fullText: "本路线图分为三个阶段：第一阶段（1–4周）完成Python或C语言入门，掌握基本语法与调试；第二阶段（5–10周）学习Git版本控制与Linux基础命令；第三阶段（11–16周）选择一个方向做小项目，推荐Web前端或命令行工具。每个阶段均附有推荐书目与在线资源。",
    sourceUrl: "https://example.com/cs-roadmap",
  },
  {
    id: "r2",
    type: "课程",
    title: "数据结构期末复习资料合集",
    summary: "整合历年期末真题、重点算法手写练习和思维导图，覆盖链表、树、图、排序算法等核心考点。",
    tags: ["数据结构", "期末", "真题", "算法"],
    stage: "大二",
    updatedAt: "2026-05-28",
    contributor: "李云舒",
    isSaved: false,
    fullText: "资料合集包含：2021–2025年期末真题及参考答案、重点数据结构图示说明、八大排序算法对比与手写代码、树与图的BFS/DFS模板。建议期末前三周开始，每天2小时刷真题。",
    sourceUrl: "https://example.com/ds-review",
  },
  {
    id: "r3",
    type: "竞赛",
    title: "蓝桥杯从报名到备赛全指南",
    summary: "详解蓝桥杯报名流程、赛制说明、历届真题分析及备赛策略，附带高频考点与刷题计划模板。",
    tags: ["蓝桥杯", "竞赛", "算法", "备赛"],
    stage: "大一至大三",
    updatedAt: "2026-04-10",
    contributor: "王浩然",
    isSaved: true,
    fullText: "蓝桥杯分省赛与全国赛两阶段。建议提前三个月备赛：第一个月主攻数学题与基础算法；第二个月刷历年真题；第三个月模拟考试，练习时间管理。本文附有历年省赛通过率参考和推荐刷题平台。",
    sourceUrl: "https://example.com/lanqiao-guide",
  },
  {
    id: "r4",
    type: "路线",
    title: "Web 前端入门资源清单",
    summary: "精选适合零基础同学的前端学习资源，覆盖HTML/CSS/JavaScript基础到第一个作品上线的完整路径。",
    tags: ["前端", "HTML", "CSS", "JavaScript", "零基础"],
    stage: "大一至大二",
    updatedAt: "2026-07-02",
    contributor: "陈晓薇",
    isSaved: false,
    fullText: "推荐路径：MDN文档入门 → FreeCodeCamp基础认证 → 用Vite搭建第一个项目 → 部署到GitHub Pages。预计8周完成，每周投入6小时可在4周内完成首个可展示作品。",
    sourceUrl: "https://example.com/frontend-list",
  },
  {
    id: "r5",
    type: "升学",
    title: "南林计算机保研信息索引",
    summary: "整理南京林业大学计算机学院近三年保研去向、院校联系方式、夏令营申请时间线与经验帖汇总。",
    tags: ["保研", "升学", "夏令营", "信息汇总"],
    stage: "大三至大四",
    updatedAt: "2026-03-18",
    contributor: "刘思远",
    isSaved: false,
    fullText: "本索引汇总2023–2025届计算机学院保研数据：保研率约15%，去向包括985/211高校及中科院系所。夏令营申请通常在每年5–6月，建议大三下学期开始准备成绩单、项目经历和个人陈述。",
    sourceUrl: "https://example.com/baoyan-index",
  },
  {
    id: "r6",
    type: "经验",
    title: "408 考研经验与时间规划",
    summary: "过来人分享备考408的完整时间线，包括各科目投入比例、参考教材选择和冲刺阶段复盘。",
    tags: ["考研", "408", "经验", "时间规划"],
    stage: "大三至大四",
    updatedAt: "2026-02-20",
    contributor: "赵婉清",
    isSaved: false,
    fullText: "408包含数据结构、计算机组成原理、操作系统、计算机网络四门科目。建议备考周期12个月：3–6月一刷教材，7–9月二刷刷题，10–12月真题模拟。个人推荐王道系列配套教材，效果明显。",
    sourceUrl: "https://example.com/408-experience",
  },
];

export const folders: Folder[] = [
  { id: "f-all", name: "全部收藏", itemIds: ["r1", "r3"] },
  { id: "f-course", name: "课程学习", itemIds: ["r1"] },
  { id: "f-contest", name: "竞赛准备", itemIds: ["r3"] },
  { id: "f-career", name: "升学与就业", itemIds: [] },
];

export const mockUser: MockUser = {
  name: "林同学",
  avatarColor: "#B5262C",
  dept: "计算机科学与技术",
  grade: "大二",
  bio: "热爱前端开发，正在探索全栈方向，偶尔参加竞赛。",
  points: 320,
  aiProfile: ["零基础前端探索中", "偏好项目式学习", "每周可投入 6 小时", "对竞赛有兴趣"],
  contributionIds: ["r4"],
};

export const sampleChat: ChatTurn[] = [
  {
    role: "user",
    content: "我大一，想做网站，但不知道先学什么。",
  },
  {
    role: "ai",
    content: "听起来你对Web开发有兴趣，这是个很好的方向！\n\n我想先了解一下你的情况：\n\n**你更倾向哪种学习方式？**\n- A. 先快速做出一个作品，边做边学\n- B. 先系统打基础，再动手项目\n\n另外，每周大约能投入多少时间？",
  },
  {
    role: "user",
    content: "想先做出作品，每周大概 6 小时左右。",
  },
  {
    role: "ai",
    content: "明白了！每周 6 小时 + 追求快速出作品，非常适合走**轻量前端路线**。\n\n我为你筛选了 3 份适合零基础、可在 4 周内开始实践的资料。它们的共同点是：上手成本低、有明确产出、不需要后端基础。",
    recommendationIds: ["r4", "r1"],
  },
];

export const recentlyUpdated = ["r4", "r2", "r3"];
export const trending = ["r1", "r6", "r5"];
