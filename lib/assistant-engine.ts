import knowledgeData from '@/app/data/knowledge.json';
import {
  searchChunks,
  type Corpus,
  type KnowledgeChunk,
  type SearchHit,
} from '@/lib/knowledge-search';
import { presentKnowledgeChunk } from '@/lib/knowledge-presenter';
import {
  classifyRequestIntent,
  missingRequiredFields,
  updateProfile,
  type StudentProfile,
} from '@/lib/profile-parser';

export type { StudentProfile } from '@/lib/profile-parser';
export type { Corpus, KnowledgeChunk, SearchHit } from '@/lib/knowledge-search';

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
  generation?: {
    mode: 'baseline' | 'rag';
    model?: string;
    note?: string;
  };
};

const allChunks = knowledgeData.chunks as KnowledgeChunk[];

export function searchKnowledge(
  query: string,
  corpus: Corpus,
  limit = 5,
): SearchHit[] {
  return searchChunks(allChunks, query, corpus, limit).map(
    presentKnowledgeChunk,
  );
}

function knowledgeHitsById(ids: string[]): SearchHit[] {
  return ids.flatMap((id, index) => {
    const chunk = allChunks.find((item) => item.id === id);
    return chunk
      ? [presentKnowledgeChunk({ ...chunk, score: 200 - index }) as SearchHit]
      : [];
  });
}

function mergeHits(...groups: SearchHit[][]): SearchHit[] {
  return groups
    .flat()
    .filter(
      (hit, index, items) =>
        items.findIndex((item) => item.id === hit.id) === index,
    );
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
      return chunk
        ? presentKnowledgeChunk({ ...chunk, score: 100 - index })
        : undefined;
    })
    .filter((item): item is Exclude<typeof item, undefined> => Boolean(item));
}

function preferredResourcesForFoundation(foundation?: string): SearchHit[] {
  const preferredIds: Record<string, string[]> = {
    '人工智能 / 计算机视觉': [
      'NJFU-RES-CEA5C79F31',
      'NJFU-RES-A144665896',
      'NJFU-RES-B448A010DF',
      'NJFU-RES-F064439644',
      'NJFU-RES-CC97792005',
    ],
    信息安全: [
      'NJFU-RES-FE79F61A11',
      'NJFU-RES-570EE94C5F',
      'NJFU-RES-E6D869DAB2',
      'NJFU-RES-8FE4C06D13',
    ],
    算法与程序设计: [
      'NJFU-RES-49E545D092',
      'NJFU-RES-192FD4BAD2',
      'NJFU-RES-A55F57E254',
      'NJFU-RES-79302683F5',
    ],
    数学与统计: [
      'NJFU-RES-32D5277C00',
      'NJFU-RES-3219992A28',
      'NJFU-RES-78AA5C680C',
      'NJFU-RES-EB51A1F313',
      'NJFU-RES-F2841FE4EC',
    ],
    软件与产品开发: [
      'NJFU-RES-7AB0708E6B',
      'NJFU-RES-48BE727D54',
      'NJFU-RES-590DFB3688',
      'NJFU-RES-4B81DA1810',
    ],
    数据库与数据管理: [
      'NJFU-RES-DE389DB9DC',
      'NJFU-RES-9D9AEA1073',
      'NJFU-RES-30B3A92619',
      'NJFU-RES-02FEA79929',
    ],
    系统与底层开发: [
      'NJFU-RES-8FE4C06D13',
      'NJFU-RES-C1EF3CEF13',
      'NJFU-RES-940D1B3015',
      'NJFU-RES-C7EBEAC0CE',
      'NJFU-RES-87481C00B1',
    ],
    嵌入式与物联网: [
      'NJFU-RES-5673A98EAB',
      'NJFU-RES-154950B342',
      'NJFU-RES-F0D9676364',
      'NJFU-RES-A59EB6FF6C',
    ],
  };
  const ids = foundation ? (preferredIds[foundation] ?? []) : [];
  const resources = allChunks.filter((chunk) => chunk.corpus === 'resources');
  return ids
    .map((id, index) => {
      const chunk = resources.find((item) => item.id === id);
      return chunk
        ? presentKnowledgeChunk({ ...chunk, score: 100 - index })
        : undefined;
    })
    .filter((item): item is Exclude<typeof item, undefined> => Boolean(item));
}

function lookupReply(input: string, profile: StudentProfile): AssistantReply {
  const wantsResources = /资料|真题|课件|教材|模板|报告|github/i.test(input);
  const asksForComposition =
    /推免.{0,8}(?:综合成绩)?.{0,8}(?:组成|构成)|(?:组成|构成).{0,8}推免/.test(
      input,
    );
  const asksForHistoricalFivePoints =
    /(?:5\s*分|五分).{0,10}(?:以上|超过)|(?:以上|超过).{0,10}(?:5\s*分|五分)/.test(
      input,
    );
  const asksAboutGpaThreshold =
    /GPA.{0,12}(?:40%|前\s*40)|(?:40%|前\s*40).{0,12}GPA/i.test(input);
  const policyHits = asksForComposition
    ? knowledgeHitsById([
        'policy-md-003',
        'policy-csv-01_信息学院2026届推免综合成绩构成-001',
        'policy-csv-01_信息学院2026届推免综合成绩构成-002',
        'policy-csv-01_信息学院2026届推免综合成绩构成-003',
        'policy-csv-01_信息学院2026届推免综合成绩构成-004',
        'policy-csv-01_信息学院2026届推免综合成绩构成-005',
        'policy-csv-01_信息学院2026届推免综合成绩构成-006',
        'policy-md-001',
      ])
    : asksForHistoricalFivePoints
      ? knowledgeHitsById([
          'policy-md-006',
          'policy-csv-04_学年综测竞赛加分历史口径-001',
          'policy-csv-04_学年综测竞赛加分历史口径-002',
          'policy-csv-04_学年综测竞赛加分历史口径-003',
          'policy-csv-04_学年综测竞赛加分历史口径-004',
          'policy-csv-04_学年综测竞赛加分历史口径-005',
          'policy-csv-04_学年综测竞赛加分历史口径-006',
          'policy-csv-05_旧版学年综测B类通用分值-001',
          'policy-csv-05_旧版学年综测B类通用分值-002',
          'policy-csv-05_旧版学年综测B类通用分值-003',
        ])
      : asksAboutGpaThreshold
        ? knowledgeHitsById([
            'policy-md-002',
            'policy-md-036',
            'policy-md-003',
            'policy-md-001',
            'policy-md-004',
          ])
        : searchKnowledge(input, 'policy', 5);
  const resourceHits = wantsResources
    ? searchKnowledge(input, 'resources', 6)
    : [];

  const text = asksForHistoricalFivePoints
    ? '下面只按历史“学年综测发展素质分”口径筛选高于 5 分的奖项，不与推免综合成绩中的竞赛贡献分混算。申报前请用本年学院细则复核是否认定、奖级、排名折算和截止日期。'
    : wantsResources
      ? '我已在限定的 NJFU-Courses 仓库目录中检索，右侧的资料来自真实文件记录，点击即可打开 GitHub 原文件。'
      : '我已同时检索政策库和资料目录库。右侧显示本次命中的原始条目，回答不会把历史口径冒充为当年政策。';

  return { kind: 'lookup', text, profile, policyHits, resourceHits };
}

export function answerUser(
  input: string,
  currentProfile: StudentProfile,
): AssistantReply {
  const asksForPersonalDecision =
    /(推荐|适合我|我适合|适合参加|应该(?:参加|选择|验证|先)|该参加|先看|先补|第一步|怎么开始|从哪里开始|哪个比赛开始|想参加.+比赛|是转.+还是|继续做.+方向)/.test(
      input,
    );
  const isDirectLookup = classifyRequestIntent(input) === 'lookup';
  const profile = isDirectLookup
    ? currentProfile
    : updateProfile(currentProfile, input);

  if (isDirectLookup) return lookupReply(input, profile);

  const missing = missingRequiredFields(profile);
  const asksForContestDecision =
    asksForPersonalDecision &&
    /(比赛|竞赛|大赛|挑战赛|蓝桥杯|建模|C4|ISCC|系统能力|转算法|网络方向)/i.test(
      input,
    );
  const hasEnoughContestContext = Boolean(
    (profile.foundation || profile.interest) &&
    asksForContestDecision &&
    (profile.grade ||
      profile.goal ||
      profile.weeklyHours ||
      profile.team ||
      /蓝桥杯|系统能力|物联网|机器人|CISC|ISCC|数学建模/i.test(input)),
  );

  if (missing.length > 0 && !hasEnoughContestContext) {
    return {
      kind: 'clarify',
      text: `还差 ${missing.length} 项会直接影响推荐的信息。请在下方补全，已识别的内容不需要重复填写。`,
      profile,
      policyHits: [],
      resourceHits: [],
    };
  }

  const direction = profile.foundation ?? profile.interest;

  if (direction === '计算机网络') {
    const routeHits = searchKnowledge(
      '中国高校计算机大赛 C4 网络技术挑战 适合学生 时间投入 能力 政策收益 第一步',
      'policy',
      12,
    );
    const stageHits =
      profile.grade === '大一'
        ? knowledgeHitsById(['policy-md-007'])
        : profile.grade === '大二'
          ? knowledgeHitsById(['policy-md-008'])
          : profile.grade === '大三'
            ? knowledgeHitsById(['policy-md-009', 'policy-md-010'])
            : [];
    const policyHits = mergeHits(
      ...routeHits
        .filter(
          (hit) =>
            hit.title.includes('中国高校计算机大赛') ||
            hit.content.includes('网络技术挑战'),
        )
        .map((hit) => [hit]),
      stageHits,
    ).slice(0, 5);
    const resourceHits = preferredResourcesForNetwork();
    const confirmedContext = [
      profile.grade,
      profile.foundation
        ? `${profile.foundation}基础`
        : `${profile.interest}兴趣`,
      profile.weeklyHoursLabel,
      profile.team,
    ]
      .filter(Boolean)
      .join('、');
    return {
      kind: 'recommendation',
      text: `结合你已提供的${confirmedContext}，首选应该是 C4 中的网络技术挑战方向。这个选择不是因为它“理论分值最高”，而是你能把现有课程基础快速变成可提交的网络方案、仿真环境、测试结果和技术报告。`,
      profile,
      recommendation: {
        title: '首选：C4 · 网络技术挑战',
        fit: `与计算机网络、组网和 Packet Tracer 经验直接衔接${profile.team ? `；你已提供的组队情况是${profile.team}，可以再按实际人数安排方案、实现测试和文档展示` : '；组队人数尚未提供，确定赛项后再按实际人数分工'}。`,
        tradeoff: profile.algorithmWeak
          ? '你明确提到算法基础一般，短期转向 ICPC/CCPC 的时间成本更高。若后续更偏安全，再把 ISCC/信安竞赛作为第二阶段。'
          : '如果也在考虑算法赛，应先用限时题验证算法基础和转轨成本，不根据未提供的能力情况替你下结论。若后续更偏安全，再把 ISCC/信安竞赛作为第二阶段。',
        preparation:
          '建议按 3–6 个月准备一轮；前 2 周先做一个最小可演示组网项目，再决定是否长期投入。',
        skills: [
          'IP 规划与子网划分',
          '交换与路由基础',
          'Packet Tracer 仿真',
          '测试记录与故障排查',
          '技术报告与展示',
        ],
        steps: [
          {
            label: '今天',
            title: '拆解题目与评分标准',
            detail:
              '先打开右侧的“题目和要求”、“任务书”和“评分标准”，列出必须交付的成果。',
          },
          {
            label: '第 1 周',
            title: '完成最小组网闭环',
            detail:
              '三人分工，完成拓扑、IP 规划、连通性测试，并留存截图和问题记录。',
          },
          {
            label: '第 2–4 周',
            title: '补齐技能并形成初版报告',
            detail:
              '用教材查缺补漏，按报告模板固化“需求—方案—实现—测试—复盘”。',
          },
          {
            label: '3–6 个月',
            title: '按当届赛题迭代',
            detail:
              '确认本届赛道、时间和学院认定口径后，再提升规模、可靠性、安全性与表达质量。',
          },
        ],
      },
      policyHits,
      resourceHits,
    };
  }

  const routeQuery = `${input} ${direction} ${profile.goal ?? ''} 适合学生 时间投入 第一步`;
  const topicPolicyHits =
    /物联网/.test(input) && /机器人/.test(input)
      ? knowledgeHitsById([
          'policy-md-030',
          'policy-md-031',
          'policy-md-032',
          'policy-md-033',
          'policy-md-007',
        ])
      : /(?:CTF|信息安全|CISC|ISCC)/i.test(input)
        ? knowledgeHitsById([
            'policy-md-026',
            'policy-md-027',
            'policy-md-028',
            'policy-csv-06_竞赛政策对应速查-010',
            'policy-csv-06_竞赛政策对应速查-014',
          ])
        : /系统能力/.test(input)
          ? knowledgeHitsById(['policy-md-029', 'policy-md-007'])
          : [];
  const searchedPolicyHits = searchKnowledge(routeQuery, 'policy', 10).filter(
    (hit) => {
      const stage = hit.title.match(/^(大[一二三四])阶段/)?.[1];
      return !stage || stage === profile.grade;
    },
  );
  const policyHits = mergeHits(topicPolicyHits, searchedPolicyHits).slice(0, 6);
  const curatedResources = preferredResourcesForFoundation(direction);
  const searchedResources = searchKnowledge(
    `${input} ${direction} 课程 学习 练习 教材`,
    'resources',
    8,
  );
  const resourceHits = [...curatedResources, ...searchedResources]
    .filter(
      (hit, index, items) =>
        items.findIndex((item) => item.id === hit.id) === index,
    )
    .slice(0, 5);
  const title = policyHits[0]?.title ?? '根据现有方向选择一条主线';
  const directionBasis = profile.foundation
    ? `你已提供的${profile.foundation}基础`
    : `你明确表达的${profile.interest}兴趣（当前基础尚未确认）`;
  const preparation = profile.weeklyHoursLabel
    ? `先用 2 周，按“${profile.weeklyHoursLabel}”完成一次低成本验证。`
    : '先用 2 周完成一次低成本验证；每周投入时间尚未提供，不把默认时长当作你的情况。';
  return {
    kind: 'recommendation',
    text: `根据${directionBasis}，我更倾向从“${title}”开始验证。右侧已同时列出竞赛判断依据和可立即使用的课程资料。`,
    profile,
    recommendation: {
      title: `建议先验证：${title}`,
      fit: '先用现有基础做一个最小作品，比只根据奖项分值选赛更容易获得可提交的成果。',
      tradeoff: '当届赛项、奖项等级和学院认定规则必须再向官方或辅导员核验。',
      preparation,
      skills: [direction ?? '方向基础', '项目分工', '技术文档', '展示与复盘'],
      steps: [
        {
          label: '今天',
          title: '阅读赛事条目',
          detail: '确认适合对象、交付物和时间投入。',
        },
        {
          label: '本周',
          title: '打开一份入门资料',
          detail: '完成可以被别人查看的最小成果。',
        },
        {
          label: '两周后',
          title: '决定是否继续',
          detail: '根据进度、队伍稳定性和官方认定结果决定。',
        },
      ],
    },
    policyHits,
    resourceHits,
  };
}

export const knowledgeStats = knowledgeData.stats;
