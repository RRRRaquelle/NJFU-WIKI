import { answerUser, type StudentProfile } from '@/lib/assistant-engine';
import { generateGroundedReply } from '@/lib/rag-generator';

type AdvisorRequest = {
  input?: unknown;
  profile?: unknown;
};

function isProfile(value: unknown): value is StudentProfile {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
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

  try {
    const reply = await generateGroundedReply(body.input.trim(), baseline.profile, baseline);
    return Response.json({ reply });
  } catch (error) {
    const note = error instanceof Error ? error.message : '大模型生成失败';
    return Response.json({
      reply: {
        ...baseline,
        generation: { mode: 'baseline', note: `${note}，已回退到规则基线` },
      },
    });
  }
}
