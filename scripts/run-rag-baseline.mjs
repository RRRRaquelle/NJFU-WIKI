import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { searchChunks } from '../lib/knowledge-search.ts';
import { missingRequiredFields, updateProfile } from '../lib/profile-parser.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const casesPath = path.join(projectRoot, 'evals', 'rag-eval-cases.jsonl');
const knowledgePath = path.join(projectRoot, 'app', 'data', 'knowledge.json');
const outputDir = path.join(projectRoot, 'evals', 'results');
const runName = (process.env.EVAL_RUN_NAME ?? 'latest').replace(/[^a-zA-Z0-9._-]/g, '-');

const cases = (await readFile(casesPath, 'utf8'))
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const knowledge = JSON.parse(await readFile(knowledgePath, 'utf8'));

function sameValue(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function round(value) {
  return Number(value.toFixed(4));
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function dcg(grades) {
  return grades.reduce((sum, grade, index) => sum + ((2 ** grade) - 1) / Math.log2(index + 2), 0);
}

function retrievalMetrics(hits, task, k = 5) {
  const top = hits.slice(0, k);
  const relevant = new Set(task.relevant_ids);
  const ranks = top
    .map((hit, index) => relevant.has(hit.id) ? index + 1 : 0)
    .filter(Boolean);
  const relevantCount = ranks.length;
  const precisionAtRelevantRanks = ranks.map((rank, index) => (index + 1) / rank);
  const grades = top.map((hit) => task.graded_relevance?.[hit.id] ?? 0);
  const idealGrades = Object.values(task.graded_relevance ?? {})
    .sort((a, b) => b - a)
    .slice(0, k);
  const idealDcg = dcg(idealGrades);

  return {
    hitAt5: relevantCount > 0 ? 1 : 0,
    recallAt5: round(relevantCount / Math.max(1, relevant.size)),
    mrrAt5: ranks.length ? round(1 / ranks[0]) : 0,
    precisionAt5: round(relevantCount / k),
    contextPrecisionAt5: round(mean(precisionAtRelevantRanks)),
    ndcgAt5: idealDcg ? round(dcg(grades) / idealDcg) : 0,
  };
}

const caseResults = [];
const profileFieldChecks = [];
const retrievalResults = [];

for (const testCase of cases) {
  let profile = {};
  for (const turn of testCase.conversation ?? []) profile = updateProfile(profile, turn);

  const profileChecks = Object.entries(testCase.expected_profile ?? {}).map(([field, expected]) => {
    const actual = profile[field];
    const passed = sameValue(actual, expected);
    const check = { caseId: testCase.case_id, field, expected, actual, passed };
    profileFieldChecks.push(check);
    return check;
  });

  const retrievalChecks = (testCase.retrieval ?? []).map((task) => {
    const hits = searchChunks(knowledge.chunks, task.query, task.corpus, 5);
    const metrics = retrievalMetrics(hits, task);
    const result = {
      caseId: testCase.case_id,
      group: testCase.group,
      corpus: task.corpus,
      query: task.query,
      relevantIds: task.relevant_ids,
      hits: hits.map((hit, index) => ({ rank: index + 1, id: hit.id, title: hit.title, score: hit.score })),
      ...metrics,
    };
    retrievalResults.push(result);
    return result;
  });

  const expectedComplete = ['grade', 'goal', 'foundation', 'weeklyHours']
    .every((field) => testCase.expected_profile?.[field] !== undefined);
  caseResults.push({
    caseId: testCase.case_id,
    group: testCase.group,
    difficulty: testCase.difficulty,
    conversation: testCase.conversation,
    profile,
    profileChecks,
    missingRequiredFields: missingRequiredFields(profile),
    unnecessaryClarification: expectedComplete && missingRequiredFields(profile).length > 0,
    retrievalChecks,
    answerRequirements: testCase.answer_requirements ?? [],
    forbiddenClaims: testCase.forbidden_claims ?? [],
  });
}

function summarizeRetrieval(items) {
  return {
    taskCount: items.length,
    hitAt5: round(mean(items.map((item) => item.hitAt5))),
    recallAt5: round(mean(items.map((item) => item.recallAt5))),
    mrrAt5: round(mean(items.map((item) => item.mrrAt5))),
    precisionAt5: round(mean(items.map((item) => item.precisionAt5))),
    contextPrecisionAt5: round(mean(items.map((item) => item.contextPrecisionAt5))),
    ndcgAt5: round(mean(items.map((item) => item.ndcgAt5))),
  };
}

const profileCases = caseResults.filter((item) => item.profileChecks.length);
const summary = {
  generatedAt: new Date().toISOString(),
  suite: {
    caseCount: cases.length,
    profileCaseCount: profileCases.length,
    retrievalTaskCount: retrievalResults.length,
  },
  profileUnderstanding: {
    fieldAccuracy: round(mean(profileFieldChecks.map((item) => item.passed ? 1 : 0))),
    exactCaseAccuracy: round(mean(profileCases.map((item) => item.profileChecks.every((check) => check.passed) ? 1 : 0))),
    unnecessaryClarificationRate: round(mean(profileCases.map((item) => item.unnecessaryClarification ? 1 : 0))),
  },
  retrieval: {
    overall: summarizeRetrieval(retrievalResults),
    policy: summarizeRetrieval(retrievalResults.filter((item) => item.corpus === 'policy')),
    resources: summarizeRetrieval(retrievalResults.filter((item) => item.corpus === 'resources')),
    dualCorpusCaseSuccessRate: round(mean(
      caseResults
        .filter((item) => item.retrievalChecks.some((check) => check.corpus === 'policy')
          && item.retrievalChecks.some((check) => check.corpus === 'resources'))
        .map((item) => item.retrievalChecks.every((check) => check.hitAt5 === 1) ? 1 : 0),
    )),
  },
};

const output = { summary, cases: caseResults, retrievalTasks: retrievalResults };
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, `${runName}.json`), `${JSON.stringify(output, null, 2)}\n`);

const percent = (value) => `${(value * 100).toFixed(1)}%`;
const markdown = `# NJFU Wiki RAG 第一轮基线\n\n生成时间：${summary.generatedAt}\n\n## 样本规模\n\n- 案例：${summary.suite.caseCount}\n- 用户画像案例：${summary.suite.profileCaseCount}\n- 检索任务：${summary.suite.retrievalTaskCount}\n\n## 用户信息理解\n\n- 字段准确率：${percent(summary.profileUnderstanding.fieldAccuracy)}\n- 整例完全正确率：${percent(summary.profileUnderstanding.exactCaseAccuracy)}\n- 不必要追问率：${percent(summary.profileUnderstanding.unnecessaryClarificationRate)}\n\n## 检索\n\n- 总体 Hit@5：${percent(summary.retrieval.overall.hitAt5)}\n- 总体 Recall@5：${percent(summary.retrieval.overall.recallAt5)}\n- 总体 MRR@5：${summary.retrieval.overall.mrrAt5.toFixed(3)}\n- 总体 nDCG@5：${summary.retrieval.overall.ndcgAt5.toFixed(3)}\n- 政策库 Hit@5：${percent(summary.retrieval.policy.hitAt5)}\n- 资料目录库 Hit@5：${percent(summary.retrieval.resources.hitAt5)}\n- 双库同时命中率：${percent(summary.retrieval.dualCorpusCaseSuccessRate)}\n\n> 这是接入大模型前的规则检索基线。生成质量指标需要在配置真实模型后使用同一批案例计算。\n`;
await writeFile(path.join(outputDir, `${runName}.md`), markdown);

console.log(JSON.stringify(summary, null, 2));
