import type { KnowledgeChunk } from '@/lib/knowledge-search';

function lineValue(content: string, label: string) {
  return content
    .split('\n')
    .find((line) => line.startsWith(`${label}：`))
    ?.slice(label.length + 1)
    .trim();
}

function stripOutlinePrefix(title: string) {
  return title
    .replace(/^\s*(?:第\s*)?\d{1,2}\s*(?:[.、．:：]|(?=[\u3400-\u9fff]))\s*/, '')
    .replace(/^\s*[一二三四五六七八九十]+[、．.]\s*/, '')
    .trim();
}

function policyTitle(title: string) {
  const cleaned = stripOutlinePrefix(title);
  if (/^推免竞赛标准分$/.test(cleaned)) {
    return '南京林业大学推免竞赛标准分说明（历史口径）';
  }

  const stage = cleaned.match(/^(大[一二三四])学生[：:]/)?.[1];
  if (stage) return `${stage}阶段竞赛选择与投入建议`;

  return cleaned;
}

function resourceTitle(chunk: KnowledgeChunk) {
  const original = chunk.title.replace(/\.[a-z0-9]{1,6}$/i, '').trim();
  const chapter = original.match(/第\s*(\d+)\s*章/)?.[1];
  let topic = stripOutlinePrefix(original)
    .replace(/^第\s*\d+\s*章\s*[-–—_:：·]*\s*/, '')
    .replace(new RegExp(`^${chunk.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—_:：·]*\\s*`), '')
    .replace(/[_–—-]+/g, ' · ')
    .replace(/\s*·\s*/g, ' · ')
    .trim();

  const replacements: Array<[RegExp, string]> = [
    [/^知识点总结$/, '核心知识点与复习提纲'],
    [/^个人笔记$/, '课程学习笔记'],
    [/^分类\s*·\s*贝叶斯分类$/, '贝叶斯分类方法'],
    [/^分类\s*·\s*决策树$/, '决策树分类方法'],
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(topic)) {
      topic = replacement;
      break;
    }
  }

  const type = chunk.resourceType
    ?.replace('复习与考点资料', '复习资料')
    .replace('软件与安装资料', '环境配置资料');
  const meaningfulTopic = topic || type || '课程学习资料';
  const chapterLabel = chapter ? ` · 第${chapter}章` : '';
  const sharedTypeConcept = ['复习', '笔记', '课件', '真题', '教材', '模板', '实验', '报告']
    .some((concept) => meaningfulTopic.includes(concept) && type?.includes(concept));
  const typeLabel = type && !meaningfulTopic.includes(type) && !sharedTypeConcept ? `（${type}）` : '';
  return `${chunk.category}：${meaningfulTopic}${chapterLabel}${typeLabel}`;
}

function policyCategory(title: string) {
  if (/推免|综测|标准分|加分|认定/.test(title)) return '认定与加分规则';
  if (/大[一二三四]学生|阶段/.test(title)) return '阶段规划建议';
  if (/竞赛|大赛|挑战赛|杯/.test(title)) return '赛事适配说明';
  return '政策与经验依据';
}

function firstUsefulPolicySentence(chunk: KnowledgeChunk) {
  const lines = chunk.content
    .split('\n')
    .map((line) => line.replace(/^#+\s*/, '').trim())
    .filter((line) => (
      line
      && !line.startsWith('>')
      && line !== chunk.category
      && line !== chunk.title
      && !/^(适合的学生|时间与投入|需要什么能力|政策与收益|第一件应该做的事)$/.test(line)
    ));
  const prose = lines.find((line) => !/^[-*]\s/.test(line) && !/表格数据已移至/.test(line));
  return prose?.slice(0, 150);
}

function policySummary(chunk: KnowledgeChunk, title: string) {
  if (/推免竞赛标准分/.test(title)) {
    return '用于理解竞赛奖项如何换算为推免竞赛标准分；历史分值不能直接替代本届正式细则。';
  }
  if (/阶段竞赛选择与投入建议/.test(title)) {
    return `用于判断${title.slice(0, 2)}学生如何选择竞赛主线、控制投入并形成可复用成果。`;
  }
  return firstUsefulPolicySentence(chunk)
    ?? '用于说明赛事适合对象、准备要求、时间投入和认定注意事项。';
}

function resourceSummary(chunk: KnowledgeChunk) {
  const audience = lineValue(chunk.content, '适合用户')
    ?.replace(/的学生$/, '');
  const stage = lineValue(chunk.content, '推荐使用阶段') ?? chunk.stage;
  const purpose = audience
    ? `适合${audience}`
    : `用途：${lineValue(chunk.content, '内容说明') ?? `辅助${chunk.category}课程学习`}`;
  const stageHint = !stage
    ? ''
    : stage.endsWith('使用')
      ? `建议${stage}。`
      : `建议用于${stage}。`;
  return `${purpose}。${stageHint}`;
}

export type PresentationFields = {
  originalTitle: string;
  displayCategory: string;
  displaySummary: string;
};

export function presentKnowledgeChunk<T extends KnowledgeChunk>(chunk: T): T & PresentationFields {
  const originalTitle = chunk.title;
  const title = chunk.corpus === 'policy' ? policyTitle(originalTitle) : resourceTitle(chunk);
  return {
    ...chunk,
    title,
    originalTitle,
    displayCategory: chunk.corpus === 'policy' ? policyCategory(title) : (chunk.resourceType ?? '课程资料'),
    displaySummary: chunk.corpus === 'policy' ? policySummary(chunk, title) : resourceSummary(chunk),
  };
}
