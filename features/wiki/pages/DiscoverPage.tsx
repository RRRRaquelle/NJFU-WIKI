import { FormEvent, useEffect, useRef, useState } from 'react';
import InnerNav from '../components/layout/InnerNav';
import ResourceCard from '../components/ui/ResourceCard';
import Chip from '../components/ui/Chip';
import ChatMessage from '../components/chat/ChatMessage';
import ProfileCompletionCard, {
  type ProfileCompletionValues,
} from '../components/chat/ProfileCompletionCard';
import { ResourceItem } from '../data/mock';
import type { ChatTurn } from '../data/mock';
import type { AssistantReply, StudentProfile } from '@/lib/assistant-engine';
import { completeProfileFromForm } from '@/lib/profile-parser';
import Button from '../components/ui/Button';

type DiscoverState = 'default' | 'search' | 'ai';
type FilterType = '全部' | '课程' | '竞赛' | '升学' | '就业' | '经验';

const FILTERS: FilterType[] = ['全部', '课程', '竞赛', '升学', '就业', '经验'];
const EXAMPLE_QUESTIONS = [
  '大一想学前端，从哪里开始？',
  '蓝桥杯什么时候报名，需要准备什么？',
  '保研、考研和就业应该怎样了解？',
];

const ADVISOR_SESSION_KEY = 'njfu-wiki-advisor-session-v1';

function readAdvisorSession() {
  if (typeof window === 'undefined') return { turns: [], profile: {} };
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(ADVISOR_SESSION_KEY) ?? '{}',
    ) as {
      turns?: ChatTurn[];
      profile?: StudentProfile;
    };
    return { turns: stored.turns ?? [], profile: stored.profile ?? {} };
  } catch {
    return { turns: [], profile: {} };
  }
}

interface DiscoverPageProps {
  state: DiscoverState;
  query?: string;
  resourceItems: ResourceItem[];
  onNavigate: (page: string, state?: string, query?: string) => void;
  onSearch: (q: string) => void;
  onOpenDrawer: (item: ResourceItem) => void;
  onSave: (id: string) => void;
  onLoginRequired: (action: () => void) => void;
  isLoggedIn: boolean;
  username?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function DiscoverPage({
  state,
  query = '',
  resourceItems,
  onNavigate,
  onSearch,
  onOpenDrawer,
  onSave,
  onLoginRequired,
  isLoggedIn,
  username,
  onLogin,
  onLogout,
}: DiscoverPageProps) {
  const [aiInput, setAiInput] = useState('');
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [profile, setProfile] = useState<StudentProfile>({});
  const [sessionReady, setSessionReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<FilterType>('全部');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const recentItems = resourceItems.slice(0, 3);
  const trendItems = resourceItems.slice(3, 6);

  const searchResults = resourceItems.filter((r) => {
    const matchQuery = query
      ? r.title.includes(query) ||
        r.tags.some((t) => t.includes(query)) ||
        r.type.includes(query)
      : true;
    const matchFilter = filter === '全部' || r.type === filter;
    return matchQuery && matchFilter;
  });

  const askAdvisor = async (
    text: string,
    requestProfile: StudentProfile,
    replaceConversation = false,
  ) => {
    const userTurn: ChatTurn = { role: 'user', content: text };
    setChatTurns((prev) =>
      replaceConversation ? [userTurn] : [...prev, userTurn],
    );
    setGenerating(true);

    try {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: text, profile: requestProfile }),
      });

      const payload = (await response.json()) as {
        reply?: AssistantReply;
        error?: string;
      };
      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || `请求失败（${response.status}）`);
      }

      setProfile(payload.reply.profile);
      setChatTurns((prev) => [
        ...prev,
        { role: 'ai', content: payload.reply!.text, reply: payload.reply },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '暂时无法连接导学助手';
      setChatTurns((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `这次请求没有成功：${message}。你可以稍后重试；已输入的信息不会被当作知识库结论。`,
        },
      ]);
    } finally {
      setGenerating(false);
    }
  };

  const handleAiSubmit = (e: FormEvent | null, prefill?: string) => {
    if (e) e.preventDefault();
    const text = prefill || aiInput.trim();
    if (!text) return;

    onNavigate('discover', 'ai');
    setAiInput('');
    setProfile({});
    void askAdvisor(text, {}, true);
  };

  const handleAiContinue = (e: FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || generating) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    void askAdvisor(userMsg, profile);
  };

  const handleProfileCompletion = (values: ProfileCompletionValues) => {
    if (generating) return;
    const completedProfile = completeProfileFromForm(profile, values);
    const originalQuestion =
      chatTurns.find((turn) => turn.role === 'user')?.content ??
      '请根据我的情况给出下一步建议';
    const summary = [
      `年级：${values.grade}`,
      `目标：${values.goal}`,
      `课程或项目：${values.background}`,
      `每周可投入：${values.weeklyHours} 小时`,
    ].join('；');
    void askAdvisor(
      `我的补充信息是：${summary}。请结合这些信息给出推荐，并继续回答我最初的问题：${originalQuestion}`,
      completedProfile,
    );
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatTurns, generating]);

  useEffect(() => {
    const stored = readAdvisorSession();
    setChatTurns(stored.turns);
    setProfile(stored.profile);
    setSessionReady(true);
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    try {
      sessionStorage.setItem(
        ADVISOR_SESSION_KEY,
        JSON.stringify({ turns: chatTurns, profile }),
      );
    } catch {
      // A full storage quota should not interrupt the advisor itself.
    }
  }, [chatTurns, profile, sessionReady]);

  const handleSave = (id: string) => {
    if (!isLoggedIn) {
      onLoginRequired(() => onSave(id));
      return;
    }
    onSave(id);
  };

  // ─── AI state ────────────────────────────────────────
  if (state === 'ai') {
    return (
      <div className="min-h-screen bg-[var(--color-paper)] flex flex-col">
        <InnerNav
          currentPage="discover"
          onNavigate={(p) => onNavigate(p)}
          onSearch={onSearch}
          isLoggedIn={isLoggedIn}
          username={username}
          onLogin={onLogin}
          onLogout={onLogout}
        />

        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-8 gap-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="text"
              size="sm"
              onClick={() => onNavigate('discover', 'default')}
            >
              ← 返回发现
            </Button>
            <Button
              variant="text"
              size="sm"
              onClick={() => {
                setChatTurns([]);
                setProfile({});
                setAiInput('');
              }}
            >
              重新开始
            </Button>
          </div>

          {/* Chat turns */}
          <div className="flex flex-col gap-5 flex-1">
            {chatTurns.map((turn, i) => (
              <ChatMessage
                key={i}
                turn={turn}
                resources={resourceItems}
                onOpen={onOpenDrawer}
                onSave={handleSave}
              />
            ))}
            {!generating &&
              chatTurns.at(-1)?.role === 'ai' &&
              chatTurns.at(-1)?.reply?.kind === 'clarify' && (
                <ProfileCompletionCard
                  profile={profile}
                  disabled={generating}
                  onSubmit={handleProfileCompletion}
                />
              )}
            {generating && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-[var(--color-indigo)] flex items-center justify-center flex-shrink-0 mt-1">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                  </svg>
                </div>
                <div className="bg-white border border-[var(--color-border)] rounded-2xl rounded-tl-sm px-5 py-4">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-[rgba(23,23,25,0.3)] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleAiContinue}
            className="sticky bottom-0 bg-[var(--color-paper)] pt-4 pb-2"
          >
            <div className="flex gap-3 border border-[var(--color-border)] rounded-2xl bg-white overflow-hidden px-4 py-3">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="继续描述你的问题…"
                className="flex-1 text-sm font-body text-[var(--color-ink)] bg-transparent outline-none placeholder:text-[rgba(23,23,25,0.35)]"
              />
              <button
                type="submit"
                disabled={!aiInput.trim() || generating}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-crimson)] disabled:opacity-40 transition-colors flex-shrink-0"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── Search state ────────────────────────────────────
  if (state === 'search') {
    return (
      <div className="min-h-screen bg-[var(--color-paper)] flex flex-col">
        <InnerNav
          currentPage="discover"
          onNavigate={(p) => onNavigate(p)}
          onSearch={onSearch}
          defaultQuery={query}
          isLoggedIn={isLoggedIn}
          username={username}
          onLogin={onLogin}
          onLogout={onLogout}
        />

        <main className="flex-1 max-w-6xl mx-auto w-full px-[clamp(24px,4vw,64px)] py-10 flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Button
              variant="text"
              size="sm"
              onClick={() => onNavigate('discover', 'default')}
            >
              ← 返回发现
            </Button>
            <div>
              <h1 className="font-serif font-bold text-2xl text-[var(--color-ink)]">
                关于「{query}」的资料
              </h1>
              <p className="text-sm text-[rgba(23,23,25,0.5)] font-body mt-1">
                共 {searchResults.length} 条结果
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Chip
                key={f}
                label={f}
                variant="filter"
                active={filter === f}
                onClick={() => setFilter(f)}
              />
            ))}
          </div>

          {/* Results */}
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {searchResults.map((item) => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  onOpen={onOpenDrawer}
                  onSave={handleSave}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-[rgba(23,23,25,0.2)]"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <p className="text-lg font-serif font-bold text-[var(--color-ink)]">
                没有找到相关资料
              </p>
              <p className="text-sm text-[rgba(23,23,25,0.5)] font-body">
                换个关键词，或者让 AI 帮你找
              </p>
              <div className="flex gap-3 mt-2">
                <Button
                  variant="secondary"
                  onClick={() => onNavigate('discover', 'default')}
                >
                  换个关键词
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    handleAiSubmit(null, `关于“${query}”的资料`);
                  }}
                >
                  问问 AI
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ─── Default state ────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col">
      <InnerNav
        currentPage="discover"
        onNavigate={(p) => onNavigate(p)}
        onSearch={onSearch}
        isLoggedIn={isLoggedIn}
        username={username}
        onLogin={onLogin}
        onLogout={onLogout}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-[clamp(24px,4vw,64px)] py-14 flex flex-col gap-14">
        {/* AI input area */}
        <section className="flex flex-col gap-6">
          <h1 className="font-serif font-bold text-3xl text-[var(--color-ink)]">
            今天想解决什么问题？
          </h1>

          {chatTurns.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('discover', 'ai')}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-white px-5 py-4 text-left transition-all hover:border-[var(--color-ink)] hover:shadow-sm"
            >
              <span>
                <strong className="block text-sm text-[var(--color-ink)]">
                  继续上次对话
                </strong>
                <small className="mt-1 block text-[rgba(23,23,25,0.5)]">
                  已保留 {Math.ceil(chatTurns.length / 2)} 轮消息和当前用户画像
                </small>
              </span>
              <span
                aria-hidden="true"
                className="text-lg text-[var(--color-crimson)]"
              >
                →
              </span>
            </button>
          )}

          <form onSubmit={handleAiSubmit} className="relative">
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="比如：我是计算机大一学生，想学前端，但不知道先学什么……"
              rows={4}
              className="w-full resize-none border border-[var(--color-border)] rounded-2xl px-6 py-5 text-base font-body text-[var(--color-ink)] bg-white placeholder:text-[rgba(23,23,25,0.35)] focus:outline-none focus:border-[var(--color-ink)] transition-colors pr-14 leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAiSubmit(null);
                }
              }}
            />
            <button
              type="submit"
              disabled={!aiInput.trim()}
              className="absolute right-4 bottom-4 w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-crimson)] disabled:opacity-30 transition-all"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>

          {/* Example questions */}
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleAiSubmit(null, q)}
                className="px-4 py-2 rounded-full border border-[var(--color-border)] text-sm font-body text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[rgba(23,23,25,0.04)] transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </section>

        {/* Recently updated */}
        <section className="flex flex-col gap-5">
          <h2 className="font-serif font-bold text-xl text-[var(--color-ink)]">
            最近更新
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentItems.map((item) => (
              <ResourceCard
                key={item.id}
                item={item}
                onOpen={onOpenDrawer}
                onSave={handleSave}
              />
            ))}
          </div>
        </section>

        {/* Trending */}
        <section className="flex flex-col gap-5">
          <h2 className="font-serif font-bold text-xl text-[var(--color-ink)]">
            大家正在看
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trendItems.map((item) => (
              <ResourceCard
                key={item.id}
                item={item}
                onOpen={onOpenDrawer}
                onSave={handleSave}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
