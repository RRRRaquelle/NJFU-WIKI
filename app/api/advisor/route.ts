import { answerUser, type StudentProfile } from '@/lib/assistant-engine';
import { isAllowedRequestOrigin, reserveModelQuota } from '@/lib/demo-request-guard';
import { generateGroundedReply } from '@/lib/rag-generator';

type AdvisorRequest = {
  input?: unknown;
  profile?: unknown;
};

function isProfile(value: unknown): value is StudentProfile {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  if (!isAllowedRequestOrigin(request)) {
    return Response.json({ error: '不允许从其他站点调用演示接口' }, { status: 403 });
  }

  let body: AdvisorRequest;
  try {
    body = await request.json() as AdvisorRequest;
  } catch {
    return Response.json({ error: '请求内容必须是 JSON' }, { status: 400 });
  }

  if (typeof body.input !== 'string' || !body.input.trim() || body.input.length > 800) {
    return Response.json({ error: '问题必须是 1–800 字符的文本' }, { status: 400 });
  }

  const profile = isProfile(body.profile) ? body.profile : {};
  const baseline = answerUser(body.input.trim(), profile);
  const modelConfigured = Boolean(
    process.env.LLM_API_BASE_URL?.trim()
      && process.env.LLM_API_KEY?.trim()
      && process.env.LLM_MODEL?.trim(),
  );
  const quota = modelConfigured ? reserveModelQuota(request) : { allowed: true };

  if (!quota.allowed) {
    return Response.json({
      reply: {
        ...baseline,
        generation: { mode: 'baseline', note: quota.note },
      },
    }, {
      headers: { 'x-njfu-generation-mode': 'protected-baseline' },
    });
  }

  try {
    const reply = await generateGroundedReply(body.input.trim(), baseline.profile, baseline);
    return Response.json({ reply });
  } catch (error) {
    const note = error instanceof Error ? error.message : '大模型生成失败';
    console.warn('RAG generation fallback', { note });
    return Response.json({
      reply: {
        ...baseline,
        generation: { mode: 'baseline', note: `${note}，已回退到规则基线` },
      },
    });
  }
}
