import knowledgeData from '@/app/data/knowledge.json';
import type { KnowledgeChunk } from '@/lib/knowledge-search';
import { presentKnowledgeChunk } from '@/lib/knowledge-presenter';

const featuredIds = [
  'NJFU-RES-CEA5C79F31',
  'NJFU-RES-FE79F61A11',
  'NJFU-RES-49E545D092',
  'NJFU-RES-8137123B06',
  'NJFU-RES-4178CEA9D0',
  'NJFU-RES-E6D869DAB2',
];

function lineValue(content: string, label: string) {
  return content
    .split('\n')
    .find((line) => line.startsWith(`${label}：`))
    ?.slice(label.length + 1)
    .trim();
}

function sourceUrl(chunk: KnowledgeChunk) {
  const markdownUrl = chunk.content.match(/GitHub访问链接：\[打开资源\]\((https:\/\/github\.com\/[^)]+)\)/)?.[1];
  return markdownUrl ?? chunk.url;
}

export function GET() {
  const chunks = (knowledgeData.chunks as KnowledgeChunk[])
    .filter((chunk) => chunk.corpus === 'resources')
    .sort((left, right) => {
      const leftIndex = featuredIds.indexOf(left.id);
      const rightIndex = featuredIds.indexOf(right.id);
      if (leftIndex < 0 && rightIndex < 0) return 0;
      if (leftIndex < 0) return 1;
      if (rightIndex < 0) return -1;
      return leftIndex - rightIndex;
    });

  const resources = chunks.map(presentKnowledgeChunk).map((chunk) => ({
    id: chunk.id,
    type: '课程' as const,
    title: chunk.title,
    summary: chunk.displaySummary,
    tags: [chunk.category, chunk.resourceType].filter((item): item is string => Boolean(item)),
    stage: chunk.stage ?? '按需使用',
    updatedAt: '仓库现有',
    contributor: chunk.source,
    isSaved: false,
    fullText: [
      lineValue(chunk.content, '适合用户'),
      lineValue(chunk.content, '使用提示'),
      lineValue(chunk.content, '核验状态'),
    ].filter(Boolean).join('\n'),
    sourceUrl: sourceUrl(chunk),
  }));

  return Response.json({ resources });
}
