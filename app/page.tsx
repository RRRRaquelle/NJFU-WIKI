'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  BookOpenText,
  Bot,
  Check,
  CircleAlert,
  ExternalLink,
  FileSearch,
  Flag,
  Leaf,
  RotateCcw,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  answerUser,
  knowledgeStats,
  type AssistantReply,
  type SearchHit,
  type StudentProfile,
} from '@/lib/assistant-engine';

type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  reply?: AssistantReply;
};

type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

const initialMessage: ChatMessage = {
  id: 1,
  role: 'assistant',
  text: '你可以只说一个模糊目标，比如“我想保研，但不知道参加什么比赛”。我会先补齐关键信息，再同时查询竞赛政策库和 NJFU-Courses 资料目录库，给你一个能立即开始的方案。',
};

const demoQuestion = '我大二，想保研，但不确定应该参加哪个竞赛。';
const factualQuestion = '哪些竞赛得奖在历史口径中可以加 5 分以上？';

function profileCompletion(profile: StudentProfile) {
  return [profile.grade, profile.goal, profile.foundation, profile.weeklyHours].filter(Boolean).length * 25;
}

function excerpt(hit: SearchHit) {
  const cleaned = hit.content
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/\[[^\]]+\]\([^)]+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 125 ? `${cleaned.slice(0, 125)}…` : cleaned;
}

function ProfileItem({ label, value, icon: Icon }: { label: string; value?: string; icon: typeof Target }) {
  return (
    <div className="profile-item">
      <span className="profile-icon"><Icon size={15} /></span>
      <span>
        <small>{label}</small>
        <strong className={!value ? 'empty-value' : ''}>{value ?? '待补充'}</strong>
      </span>
    </div>
  );
}

function SourceCard({ hit, kind, index }: { hit: SearchHit; kind: 'policy' | 'resources'; index: number }) {
  const content = (
    <article className={`source-card ${kind}`}>
      <div className="source-card-topline">
        <Badge className={kind === 'policy' ? 'policy-badge' : 'resource-badge'}>
          {kind === 'policy' ? `政策依据 P${index + 1}` : `资料目录 R${index + 1}`}
        </Badge>
        <span>{hit.category}</span>
      </div>
      <h4>{hit.title}</h4>
      <p>{excerpt(hit)}</p>
      {hit.url && (
        <span className="source-link">
          打开 GitHub 原文件 <ExternalLink size={13} />
        </span>
      )}
    </article>
  );

  return hit.url ? (
    <a href={hit.url} target="_blank" rel="noreferrer" className="source-anchor" aria-label={`打开资料：${hit.title}`}>
      {content}
    </a>
  ) : content;
}

function EvidencePanel({ reply }: { reply?: AssistantReply }) {
  const policyHits = reply?.policyHits ?? [];
  const resourceHits = reply?.resourceHits ?? [];
  return (
    <aside className="evidence-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">RETRIEVAL TRACE</span>
          <h2>本轮知识依据</h2>
        </div>
        <FileSearch size={19} />
      </div>

      {!reply && (
        <div className="empty-evidence">
          <div className="search-rings"><FileSearch size={22} /></div>
          <strong>等待你的问题</strong>
          <p>这里会分开显示“为什么这样推荐”和“立即用什么资料”。</p>
        </div>
      )}

      {reply && (
        <div className="source-groups">
          <section>
            <div className="source-group-title">
              <span><ShieldCheck size={15} /> 竞赛政策库</span>
              <Badge variant="outline">{policyHits.length} 条命中</Badge>
            </div>
            <div className="source-list">
              {policyHits.length ? policyHits.slice(0, 4).map((hit, index) => (
                <SourceCard key={hit.id} hit={hit} kind="policy" index={index} />
              )) : <p className="no-hit">本轮未调用政策条目</p>}
            </div>
          </section>

          <section>
            <div className="source-group-title">
              <span><BookOpenText size={15} /> NJFU-Courses 目录库</span>
              <Badge variant="outline">{resourceHits.length} 条命中</Badge>
            </div>
            <div className="source-list">
              {resourceHits.length ? resourceHits.map((hit, index) => (
                <SourceCard key={hit.id} hit={hit} kind="resources" index={index} />
              )) : <p className="no-hit">补齐个人信息后再推荐具体资料</p>}
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}

function Recommendation({ reply }: { reply: AssistantReply }) {
  const recommendation = reply.recommendation;
  if (!recommendation) return null;
  return (
    <div className="recommendation">
      <div className="recommendation-title">
        <span><Route size={18} /></span>
        <div>
          <small>匹配结果</small>
          <h3>{recommendation.title}</h3>
        </div>
      </div>
      <div className="reason-grid">
        <div>
          <strong><Check size={15} /> 为什么适合</strong>
          <p>{recommendation.fit}</p>
        </div>
        <div>
          <strong><CircleAlert size={15} /> 取舍与备选</strong>
          <p>{recommendation.tradeoff}</p>
        </div>
      </div>
      <div className="preparation-note">
        <Flag size={16} />
        <p><strong>准备尺度：</strong>{recommendation.preparation}</p>
      </div>
      <div className="skill-strip">
        {recommendation.skills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}
      </div>
      <div className="action-plan">
        <h4>从现在开始的行动顺序</h4>
        {recommendation.steps.map((step, index) => (
          <div className="action-step" key={step.title}>
            <span className="step-number">{index + 1}</span>
            <div>
              <small>{step.label}</small>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="policy-warning">
        <ShieldCheck size={15} />
        <span>历史分类和分值只用于判断方向；实际申报前必须核对本届学院细则。</span>
      </div>
    </div>
  );
}

function Message({ message, onQuickReply }: { message: ChatMessage; onQuickReply: (value: string) => void }) {
  const assistant = message.role === 'assistant';
  return (
    <div className={`message-row ${message.role}`}>
      {assistant && <div className="avatar assistant-avatar"><Leaf size={17} /></div>}
      <div className="message-content">
        <div className="message-meta">{assistant ? 'NJFU Wiki 导学助手' : '你'}</div>
        <div className="message-bubble">
          <p>{message.text}</p>
          {message.reply?.kind === 'clarify' && (
            <div className="clarify-note">
              <Sparkles size={15} /> 先判断适配性，再查具体资料
            </div>
          )}
          {message.reply && <Recommendation reply={message.reply} />}
        </div>
        {message.reply?.quickReplies?.map((quickReply) => (
          <button className="quick-reply" key={quickReply} onClick={() => onQuickReply(quickReply)}>
            <Sparkles size={14} /> 用完整示例回答
          </button>
        ))}
      </div>
      {!assistant && <div className="avatar user-avatar">你</div>}
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [profile, setProfile] = useState<StudentProfile>({});
  const [input, setInput] = useState('');
  const [working, setWorking] = useState(false);
  const [latestReply, setLatestReply] = useState<AssistantReply>();
  const conversationEnd = useRef<HTMLDivElement>(null);
  const sendRef = useRef<(value: string) => Promise<AssistantReply | undefined>>(async () => undefined);
  const resetRef = useRef<() => void>(() => undefined);
  const stateRef = useRef({ profile, latestReply, messageCount: messages.length });

  const completion = useMemo(() => profileCompletion(profile), [profile]);

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, working]);

  const send = async (value = input): Promise<AssistantReply | undefined> => {
    const prompt = value.trim();
    if (!prompt || working) return undefined;
    const userMessage: ChatMessage = { id: Date.now(), role: 'user', text: prompt };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setWorking(true);

    let reply: AssistantReply;
    try {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: prompt, profile }),
      });
      if (!response.ok) throw new Error(`请求失败：${response.status}`);
      const payload = await response.json() as { reply?: AssistantReply };
      if (!payload.reply) throw new Error('回答内容为空');
      reply = payload.reply;
    } catch {
      reply = {
        ...answerUser(prompt, profile),
        generation: { mode: 'baseline', note: '在线生成暂不可用，已使用规则基线' },
      };
    }

    setProfile(reply.profile);
    setLatestReply(reply);
    setMessages((current) => [
      ...current,
      { id: Date.now() + 1, role: 'assistant', text: reply.text, reply },
    ]);
    setWorking(false);
    return reply;
  };

  const reset = () => {
    setMessages([initialMessage]);
    setProfile({});
    setLatestReply(undefined);
    setInput('');
  };

  useEffect(() => {
    sendRef.current = send;
    resetRef.current = reset;
    stateRef.current = { profile, latestReply, messageCount: messages.length };
  });

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    const register = async () => {
      await context.registerTool({
        name: 'send_advisor_message',
        title: '向导学助手发送问题',
        description: '提交一条学生问题，更新可见对话、用户画像和双知识库检索结果。',
        inputSchema: {
          type: 'object',
          properties: { prompt: { type: 'string', minLength: 1, maxLength: 800 } },
          required: ['prompt'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        async execute(input: unknown) {
          const prompt = typeof input === 'object' && input !== null && 'prompt' in input
            ? (input as { prompt?: unknown }).prompt
            : undefined;
          if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 800) {
            throw new Error('prompt 必须是 1–800 字符的非空文本');
          }
          const reply = await sendRef.current(prompt);
          if (!reply) throw new Error('导学助手正在处理上一条消息');
          return { status: 'answered', replyKind: reply.kind, profile: reply.profile };
        },
      }, { signal: lifecycle.signal });

      await context.registerTool({
        name: 'read_advisor_state',
        title: '读取导学助手状态',
        description: '读取当前用户画像、最新回答类型和对话消息数。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute() {
          return {
            profile: stateRef.current.profile,
            latestReplyKind: stateRef.current.latestReply?.kind ?? null,
            messageCount: stateRef.current.messageCount,
          };
        },
      }, { signal: lifecycle.signal });

      await context.registerTool({
        name: 'reset_advisor_conversation',
        title: '重置导学对话',
        description: '清除当前对话、用户画像和检索结果，回到初始状态。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute() {
          resetRef.current();
          return { status: 'reset' };
        },
      }, { signal: lifecycle.signal });
    };

    void register().catch((error) => console.warn('WebMCP registration failed', error));
    return () => lifecycle.abort();
  }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Leaf size={20} /></span>
          <span>
            <strong>NJFU Wiki</strong>
            <small>个人发展导学助手</small>
          </span>
        </div>
        <div className="mode-pill" title={latestReply?.generation?.note}>
          <span className="live-dot" />
          {latestReply?.generation?.mode === 'rag' ? '双库 RAG 生成' : '双库规则基线'}
          <b>{latestReply?.generation?.mode === 'rag' ? latestReply.generation.model : '模型待配置'}</b>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="reset-button">
          <RotateCcw size={15} /> 重置对话
        </Button>
      </header>

      <div className="workspace">
        <aside className="profile-panel">
          <div className="panel-heading profile-heading">
            <div>
              <span className="eyebrow">STUDENT CONTEXT</span>
              <h2>当前用户画像</h2>
            </div>
            <Target size={19} />
          </div>
          <div className="completion-block">
            <div><span>判断信息完整度</span><strong>{completion}%</strong></div>
            <Progress value={completion} />
          </div>
          <div className="profile-list">
            <ProfileItem label="年级" value={profile.grade} icon={Flag} />
            <ProfileItem label="主要目标" value={profile.goal} icon={Target} />
            <ProfileItem label="现有基础" value={profile.foundation} icon={BookOpenText} />
            <ProfileItem label="时间预算" value={profile.weeklyHoursLabel} icon={Route} />
            <ProfileItem label="组队情况" value={profile.team} icon={Users} />
          </div>
          <div className="corpus-summary">
            <span className="eyebrow">LOCAL KNOWLEDGE</span>
            <div><ShieldCheck size={15} /><span>竞赛政策</span><b>{knowledgeStats.policyChunks}</b></div>
            <div><BookOpenText size={15} /><span>资料目录</span><b>{knowledgeStats.resourceChunks}</b></div>
            <p>检索范围仅限你的两个知识库，资料链接仅指向 NJFU-CS/NJFU-Courses。</p>
          </div>
        </aside>

        <section className="chat-panel">
          <div className="chat-heading">
            <div>
              <Badge className="mvp-badge">MVP 演示</Badge>
              <h1>先弄清你需要什么，再给你资料</h1>
              <p>可以从一句模糊的问题开始。</p>
            </div>
            <Bot size={22} />
          </div>

          <div className="conversation" aria-live="polite">
            {messages.map((message) => (
              <Message key={message.id} message={message} onQuickReply={send} />
            ))}
            {working && (
              <div className="message-row assistant">
                <div className="avatar assistant-avatar"><Leaf size={17} /></div>
                <div className="thinking"><span /><span /><span /> 正在检索两个知识库并组织回答…</div>
              </div>
            )}
            <div ref={conversationEnd} />
          </div>

          <div className="composer-wrap">
            {messages.length === 1 && (
              <div className="starter-prompts">
                <button onClick={() => void send(demoQuestion)}><Sparkles size={14} /> 运行完整推荐示例</button>
                <button onClick={() => void send(factualQuestion)}><FileSearch size={14} /> 试一个政策查询</button>
              </div>
            )}
            <div className="composer">
              <Textarea
                aria-label="输入你的问题"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                placeholder="例如：我想保研，但不知道该准备什么比赛…"
                className="composer-input"
              />
              <Button aria-label="发送" onClick={() => void send()} disabled={!input.trim() || working} className="send-button">
                <ArrowUp size={18} />
              </Button>
            </div>
            <p className="composer-help">回答会明确区分历史口径与当届待核验信息。</p>
          </div>
        </section>

        <EvidencePanel reply={latestReply} />
      </div>
    </main>
  );
}
