import knowledgeData from '@/app/data/knowledge.json';
import { missingRequiredFields, updateProfile, type StudentProfile } from '@/lib/profile-parser';

export type { StudentProfile } from '@/lib/profile-parser';

export type Corpus = 'policy' | 'resources';

export type KnowledgeChunk = {
  id: string;
  corpus: Corpus;
  title: string;
  category: string;
  source: string;
  content: string;
  resourceType?: string;
  stage?: string;
  url?: string;
};

export type SearchHit = KnowledgeChunk & { score: number };

export type ActionStep = {
  label: string;
  title: string;
  detail: string;
};

export type AssistantReply = {
  kind: 'clarify' | 'recommendation' | 'lookup';
  text: string;
  quickReplies?: string[];
  profile: StudentProfile;
  recommendation?: {
    title: string;
    fit: string;
    tradeoff: string;
    preparation: string;
    skills: string[];
    steps: ActionStep[];
  };
  policyHits: SearchHit[];
  resourceHits: SearchHit[];
};

const allChunks = knowledgeData.chunks as KnowledgeChunk[];

const stopWords = new Set([
  '我现', '现在', '想要', '一个', '什么', '怎么', '哪些', '可以', '应该', '需要', '资料',
  '参加', '竞赛', '学生', '学校', '大学', '南京', '林业', '为了', '有什', '的资', '么资',
]);

const expansions: Record<string, string[]> = {
  '计网': ['计算机网络', '网络工程', 'Packet Tracer', '组网'],
  '网络': ['计算机网络', '网络工程', 'Packet Tracer', '组网'],
  '保研': ['推免', '综合成绩', '综测', '竞赛标准分'],
  '综测': ['学年综合素质测评', '发展素质分', '竞赛加分'],
  '算法': ['程序设计', '蓝桥杯', 'ICPC', 'CCPC', 'JSCPC'],
  '安全': ['信息安全', 'ISCC', 'CISC', 'CTF'],
  '建模': ['数学建模', '国赛', '论文'],
};

function tokenize(raw: string) {
  const text = raw.toLowerCase().normalize('NFKC');
  const words = text.match(/[a-z0-9][a-z0-9.+#-]*/g) ?? [];
  const chineseRuns = text.match(/[\u3400-\u9fff]+/g) ?? [];
  const chineseTokens: string[] = [];

  for (const run of chineseRuns) {
    if (run.length <= 5) chineseTokens.push(run);
    for (let index = 0; index < run.length - 1; index += 1) {
      chineseTokens.push(run.slice(index, index + 2));
    }
    for (let index = 0; index < run.length - 2; index += 2) {
      chineseTokens.push(run.slice(index, index + 3));
    }
  }

  const directExpansions = Object.entries(expansions)
    .filter(([key]) => text.includes(key))
    .flatMap(([, values]) => values.flatMap((value) => tokenizeWithoutExpansion(value)));

  return [...new Set([...words, ...chineseTokens, ...directExpansions])].filter(
    (token) => token.length > 1 && !stopWords.has(token),
  );
}

function tokenizeWithoutExpansion(raw: string) {
  const text = raw.toLowerCase().normalize('NFKC');
  const words = text.match(/[a-z0-9][a-z0-9.+#-]*/g) ?? [];
  const runs = text.match(/[\u3400-\u9fff]+/g) ?? [];
  return [
    ...words,
    ...runs,
    ...runs.flatMap((run) =>
      Array.from({ length: Math.max(0, run.length - 1) }, (_, index) => run.slice(index, index + 2)),
    ),
  ];
}

export function searchKnowledge(query: string, corpus: Corpus, limit = 5): SearchHit[] {
  const tokens = tokenize(query);
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ').trim();

  return allChunks
    .filter((chunk) => chunk.corpus === corpus)
    .map((chunk) => {
      const title = chunk.title.toLowerCase();
      const haystack = `${chunk.title}\n${chunk.category}\n${chunk.content}`.toLowerCase();
      let score = normalizedQuery.length > 4 && haystack.includes(normalizedQuery) ? 30 : 0;
      for (const token of tokens) {
        if (title.includes(token)) score += 7;
        const occurrences = haystack.split(token).length - 1;
        score += Math.min(occurrences, 5) * 1.35;
      }
      if (chunk.category && query.includes(chunk.category)) score += 8;
      return { ...chunk, score: Number(score.toFixed(2)) };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function preferredResourcesForNetwork(): SearchHit[] {
  const preferences = [
    '《网络工程与组网实习》-题目和要求',
    '2022-《网络工程与组网实习》-课程设计任务书',
    '《网络工程与组网实习》课程设计考核评分标准',
    '《网络工程与组网实习》课程设计-报告-模板',
    '计算机网络（第7版）-谢希仁',
  ];
  const resources = allChunks.filter((chunk) => chunk.corpus === 'resources');
  return preferences
    .map((title, index) => {
      const chunk = resources.find((item) => item.title === title);
      return chunk ? { ...chunk, score: 100 - index } : undefined;
    })
    .filter((item): item is SearchHit => Boolean(item));
}

function lookupReply(input: string, profile: StudentProfile): AssistantReply {
  const wantsResources = /资料|真题|课件|教材|模板|报告|github/i.test(input);
  const policyHits = searchKnowledge(input, 'policy', 5);
  const resourceHits = searchKnowledge(input, 'resources', wantsResources ? 6 : 3);

  const text = /5\s*分|五分/.test(input)
    ? '可以筛出历史口径中高于 5 分的奖项，但不能把旧版学年综测分值直接当成本届推免加分。右侧已列出命中的政策条目；申报前请用本年学院细则复核“是否认定、奖级、排名折算、截止日期”。'
    : wantsResources
      ? '我已在限定的 NJFU-Courses 仓库目录中检索，右侧的资料来自真实文件记录，点击即可打开 GitHub 原文件。'
      : '我已同时检索政策库和资料目录库。右侧显示本次命中的原始条目，回答不会把历史口径冒充为当年政策。';

  return { kind: 'lookup', text, profile, policyHits, resourceHits };
}

export function answerUser(input: string, currentProfile: StudentProfile): AssistantReply {
  const profile = updateProfile(currentProfile, input);
  const isDirectLookup = /(哪些|多少|几分|要求|规则|政策|资料|真题|课件|教材|模板|报告)/.test(input)
    && !/(不知道|不确定|推荐|适合我|该参加)/.test(input);

  if (isDirectLookup) return lookupReply(input, profile);

  const missing = missingRequiredFields(profile);

  if (missing.length > 0) {
    return {
      kind: 'clarify',
      text: `我已记下：${[
        profile.grade,
        profile.goal,
        profile.foundation,
        profile.weeklyHoursLabel,
        profile.team,
      ].filter(Boolean).join('、') || '暂无可确认信息'}。为了避免只按“分值高”乱推，还需要你补充：${missing.join('、')}。`,
      quickReplies: [
        '我大二，想保研；计网有基础，做过 Packet Tracer；算法一般；有两个同学，每周能投入 8 小时。',
      ],
      profile,
      policyHits: searchKnowledge(`${profile.goal ?? ''} 竞赛选择 年级 时间投入`, 'policy', 3),
      resourceHits: [],
    };
  }

  if (profile.foundation === '计算机网络') {
    const routeHits = searchKnowledge(
      '中国高校计算机大赛 C4 网络技术挑战 适合学生 时间投入 能力 政策收益 第一步',
      'policy',
      12,
    );
    const stageHit = searchKnowledge(`${profile.grade} 选择主线 可复用成果`, 'policy', 2)[0];
    const policyHits = [
      ...routeHits.filter((hit) => (
        hit.title.includes('中国高校计算机大赛') || hit.content.includes('网络技术挑战')
      )),
      stageHit,
    ].filter((hit, index, items): hit is SearchHit => Boolean(hit) && items.findIndex((item) => item?.id === hit.id) === index).slice(0, 4);
    const resourceHits = preferredResourcesForNetwork();
    const hours = profile.weeklyHours ?? 8;
    const timeLabel = profile.weeklyHoursLabel ?? `每周约 ${hours} 小时`;
    return {
      kind: 'recommendation',
      text: `结合你的${profile.grade}、${profile.foundation}基础、${timeLabel}和${profile.team ?? '组队情况'}，首选应该是 C4 中的网络技术挑战方向。这个选择不是因为它“理论分值最高”，而是你能把现有课程基础快速变成可提交的网络方案、仿真环境、测试结果和技术报告。`,
      profile,
      recommendation: {
        title: '首选：C4 · 网络技术挑战',
        fit: '与计算机网络、组网和 Packet Tracer 经验直接衔接，三人队也容易分工为方案、实现/测试、文档展示。',
        tradeoff: '不建议把 ICPC/CCPC 作为当下的第一条主线：你自评算法基础一般，短期转轨的时间成本更高。若后续更偏安全，再把 ISCC/信安竞赛作为第二阶段。',
        preparation: '建议按 3–6 个月准备一轮；前 2 周先做一个最小可演示组网项目，再决定是否长期投入。',
        skills: ['IP 规划与子网划分', '交换与路由基础', 'Packet Tracer 仿真', '测试记录与故障排查', '技术报告与展示'],
        steps: [
          { label: '今天', title: '拆解题目与评分标准', detail: '先打开右侧的“题目和要求”、“任务书”和“评分标准”，列出必须交付的成果。' },
          { label: '第 1 周', title: '完成最小组网闭环', detail: '三人分工，完成拓扑、IP 规划、连通性测试，并留存截图和问题记录。' },
          { label: '第 2–4 周', title: '补齐技能并形成初版报告', detail: '用教材查缺补漏，按报告模板固化“需求—方案—实现—测试—复盘”。' },
          { label: '3–6 个月', title: '按当届赛题迭代', detail: '确认本届赛道、时间和学院认定口径后，再提升规模、可靠性、安全性与表达质量。' },
        ],
      },
      policyHits,
      resourceHits,
    };
  }

  const routeQuery = `${profile.foundation} ${profile.goal} 适合学生 时间投入 第一步`;
  const policyHits = searchKnowledge(routeQuery, 'policy', 5);
  const resourceHits = searchKnowledge(`${profile.foundation} 课程 学习 练习 教材`, 'resources', 5);
  const title = policyHits[0]?.title ?? '根据现有基础选择一条主线';
  return {
    kind: 'recommendation',
    text: `根据你目前的${profile.foundation}基础，我更倾向从“${title}”开始验证。右侧已同时列出竞赛判断依据和可立即使用的课程资料。`,
    profile,
    recommendation: {
      title: `建议先验证：${title}`,
      fit: '先用现有基础做一个最小作品，比只根据奖项分值选赛更容易获得可提交的成果。',
      tradeoff: '当届赛项、奖项等级和学院认定规则必须再向官方或辅导员核验。',
      preparation: `先用 2 周，按“${profile.weeklyHoursLabel ?? `每周约 ${profile.weeklyHours} 小时`}”完成一次低成本验证。`,
      skills: [profile.foundation ?? '专业基础', '项目分工', '技术文档', '展示与复盘'],
      steps: [
        { label: '今天', title: '阅读赛事条目', detail: '确认适合对象、交付物和时间投入。' },
        { label: '本周', title: '打开一份入门资料', detail: '完成可以被别人查看的最小成果。' },
        { label: '两周后', title: '决定是否继续', detail: '根据进度、队伍稳定性和官方认定结果决定。' },
      ],
    },
    policyHits,
    resourceHits,
  };
}

export const knowledgeStats = knowledgeData.stats;
