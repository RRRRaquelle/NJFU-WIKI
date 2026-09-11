import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appUrl = (process.env.EVAL_APP_URL ?? 'http://127.0.0.1:3000').replace(/\/+$/, '');
const runName = (process.env.EVAL_RUN_NAME ?? 'generation-latest').replace(/[^a-zA-Z0-9._-]/g, '-');
const selectedCaseIds = new Set((process.env.EVAL_CASE_IDS ?? '').split(',').map((value) => value.trim()).filter(Boolean));
const cases = (await readFile(path.join(projectRoot, 'evals', 'rag-eval-cases.jsonl'), 'utf8'))
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .filter((item) => item.group !== 'profile_understanding')
  .filter((item) => selectedCaseIds.size === 0 || selectedCaseIds.has(item.case_id));

function combinedText(reply) {
  return [
    reply.text,
    reply.recommendation?.title,
    reply.recommendation?.fit,
    reply.recommendation?.tradeoff,
    reply.recommendation?.preparation,
    ...(reply.recommendation?.steps ?? []).flatMap((step) => [step.title, step.detail]),
  ].filter(Boolean).join('\n');
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

const results = [];
for (const testCase of cases) {
  let profile = {};
  let reply;
  for (const input of testCase.conversation) {
    const response = await fetch(`${appUrl}/api/advisor`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input, profile }),
    });
    if (!response.ok) throw new Error(`${testCase.case_id}: HTTP ${response.status}`);
    const payload = await response.json();
    reply = payload.reply;
    profile = reply.profile;
  }

  const text = combinedText(reply);
  const refs = [...text.matchAll(/\[([PR])(\d+)\]/g)].map((match) => `${match[1]}${match[2]}`);
  const validRefs = new Set([
    ...(reply.policyHits ?? []).map((_, index) => `P${index + 1}`),
    ...(reply.resourceHits ?? []).map((_, index) => `R${index + 1}`),
  ]);
  const invalidRefs = refs.filter((ref) => !validRefs.has(ref));
  const needsPolicyCitation = (reply.policyHits ?? []).length > 0;
  const needsResourceCitation = testCase.group === 'dual_corpus_recommendation' && (reply.resourceHits ?? []).length > 0;
  const citationCoverage = Number((!needsPolicyCitation || refs.some((ref) => ref.startsWith('P')))
    && (!needsResourceCitation || refs.some((ref) => ref.startsWith('R'))));
  const actionability = Number(testCase.group !== 'dual_corpus_recommendation'
    || (reply.recommendation?.steps?.length ?? 0) > 0);
  const uncertainty = Number(!testCase.forbidden_claims?.length
    || /历史|当届|核验|不确定|没有足够依据|不能保证/.test(text));
  const forbiddenMatches = (testCase.forbidden_claims ?? []).filter((claim) => text.includes(claim));

  results.push({
    caseId: testCase.case_id,
    group: testCase.group,
    replyKind: reply.kind,
    generationMode: reply.generation?.mode ?? 'unknown',
    model: reply.generation?.model ?? null,
    citationCoverage,
    citationValidity: refs.length ? Number(invalidRefs.length === 0) : 0,
    actionability,
    uncertainty,
    forbiddenClaimPass: Number(forbiddenMatches.length === 0),
    refs,
    invalidRefs,
    forbiddenMatches,
    answer: text,
    policyHitIds: (reply.policyHits ?? []).map((hit) => hit.id),
    resourceHitIds: (reply.resourceHits ?? []).map((hit) => hit.id),
  });
}

const ragResults = results.filter((item) => item.generationMode === 'rag');
const clarificationResults = results.filter((item) => item.replyKind === 'clarify');
const unexpectedBaselineResults = results.filter((item) => (
  item.generationMode === 'baseline' && item.replyKind !== 'clarify'
));
const summary = {
  generatedAt: new Date().toISOString(),
  appUrl,
  caseCount: results.length,
  ragCaseCount: ragResults.length,
  deterministicClarificationCount: clarificationResults.length,
  baselineFallbackCount: unexpectedBaselineResults.length,
  generationMetrics: ragResults.length ? {
    citationCoverage: mean(ragResults.map((item) => item.citationCoverage)),
    citationValidity: mean(ragResults.map((item) => item.citationValidity)),
    actionability: mean(ragResults.map((item) => item.actionability)),
    uncertainty: mean(ragResults.map((item) => item.uncertainty)),
    forbiddenClaimPass: mean(ragResults.map((item) => item.forbiddenClaimPass)),
  } : null,
  note: ragResults.length
    ? '自动指标只覆盖引用、行动结构和禁止内容；忠实度、相关性和推荐适配性仍需人工或独立裁判模型评分。'
    : '当前没有案例使用大模型生成，请先配置 LLM_API_BASE_URL、LLM_API_KEY 和 LLM_MODEL。',
};

const outputDir = path.join(projectRoot, 'evals', 'results');
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, `${runName}.json`), `${JSON.stringify({ summary, cases: results }, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
