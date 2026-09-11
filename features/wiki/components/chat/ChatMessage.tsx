import { ChatTurn } from "../../data/mock";
import { ResourceItem } from "../../data/mock";

interface EmbeddedCardProps {
  item: ResourceItem;
  onOpen: (item: ResourceItem) => void;
  onSave: (id: string) => void;
}

function EmbeddedCard({ item, onOpen, onSave }: EmbeddedCardProps) {
  return (
    <div
      className="border border-[var(--color-border)] rounded-2xl p-4 bg-white cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-2"
      onClick={() => onOpen(item)}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium font-body bg-[rgba(23,23,25,0.07)] px-2.5 py-0.5 rounded-full text-[var(--color-ink)]">
          {item.type}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onSave(item.id); }}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[rgba(181,38,44,0.08)] transition-colors"
        >
          {item.isSaved ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-crimson)">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
        </button>
      </div>
      <p className="font-serif font-bold text-sm text-[var(--color-ink)] leading-snug">{item.title}</p>
      <p className="text-xs text-[rgba(23,23,25,0.55)] font-body leading-relaxed line-clamp-2">{item.summary}</p>
      <p className="text-xs text-[rgba(23,23,25,0.38)] font-body">{item.stage} · {item.contributor}</p>
    </div>
  );
}

interface ChatMessageProps {
  turn: ChatTurn;
  resources: ResourceItem[];
  onOpen: (item: ResourceItem) => void;
  onSave: (id: string) => void;
}

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith("- ")) {
      return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
    }
    if (line.trim() === "") return <br key={i} />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j}>{part.slice(2, -2)}</strong>
            : part
        )}
      </p>
    );
  });
}

function AdvisorDetails({ turn }: { turn: ChatTurn }) {
  const reply = turn.reply;
  if (!reply) return null;

  const recommendation = reply.recommendation;
  const policySources = reply.kind === "clarify"
    ? []
    : reply.policyHits.slice(0, 4).map((hit, index) => ({ ...hit, ref: `P${index + 1}` }));
  const resourceSources = reply.kind === "clarify"
    ? []
    : reply.resourceHits.slice(0, 5).map((hit, index) => ({ ...hit, ref: `R${index + 1}` }));

  return (
    <div className="flex flex-col gap-3">
      {recommendation && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 font-body text-sm">
          <span className="text-xs font-medium text-[var(--color-crimson)]">个性化建议</span>
          <h3 className="mt-1 font-serif text-lg font-bold text-[var(--color-ink)]">
            {recommendation.title}
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[rgba(216,234,227,0.45)] p-3">
              <strong>为什么适合</strong>
              <p className="mt-1 text-xs leading-relaxed text-[rgba(23,23,25,0.68)]">{recommendation.fit}</p>
            </div>
            <div className="rounded-xl bg-[rgba(242,154,5,0.08)] p-3">
              <strong>取舍与风险</strong>
              <p className="mt-1 text-xs leading-relaxed text-[rgba(23,23,25,0.68)]">{recommendation.tradeoff}</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed"><strong>准备尺度：</strong>{recommendation.preparation}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recommendation.skills.map((skill) => (
              <span key={skill} className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs">{skill}</span>
            ))}
          </div>
          <div className="mt-4 border-t border-[var(--color-border)] pt-3">
            <strong>下一步行动</strong>
            <ol className="mt-2 flex flex-col gap-2">
              {recommendation.steps.map((step, index) => (
                <li key={`${step.title}-${index}`} className="grid grid-cols-[24px_1fr] gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-ink)] text-xs text-[var(--color-paper)]">{index + 1}</span>
                  <span>
                    <small className="block text-[rgba(23,23,25,0.45)]">{step.label}</small>
                    <strong className="block">{step.title}</strong>
                    <span className="block text-xs leading-relaxed text-[rgba(23,23,25,0.65)]">{step.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {policySources.length > 0 && (
        <section aria-label="本次判断依据">
          <div className="mb-2">
            <h4 className="text-sm font-semibold text-[var(--color-ink)]">本次判断依据</h4>
            <p className="text-xs text-[rgba(23,23,25,0.45)]">用于解释推荐结论；点击卡片可查看依据摘要。</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {policySources.map((source) => (
              <details key={source.ref} className="group rounded-xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.78)] p-3 open:bg-white">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[var(--color-crimson)]">{source.ref} · 政策依据</span>
                    <span className="truncate text-[rgba(23,23,25,0.4)]">{source.displayCategory ?? "政策与经验依据"}</span>
                  </div>
                  <strong className="mt-1 block text-sm leading-snug">{source.title}</strong>
                  <span className="mt-2 block text-xs text-[#1a5f80] group-open:hidden">查看依据摘要 ＋</span>
                </summary>
                <p className="mt-2 border-t border-[var(--color-border)] pt-2 text-xs leading-relaxed text-[rgba(23,23,25,0.65)]">
                  {source.displaySummary ?? source.content.slice(0, 150)}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {resourceSources.length > 0 && (
        <section aria-label="建议使用资料">
          <div className="mb-2">
            <h4 className="text-sm font-semibold text-[var(--color-ink)]">建议使用资料</h4>
            <p className="text-xs text-[rgba(23,23,25,0.45)]">标题经过整理，链接仍指向 NJFU-Courses 中的原始文件。</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {resourceSources.map((source) => (
              <a key={source.ref} href={source.url} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.78)] p-3 transition-colors hover:border-[var(--color-ink)]">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-[var(--color-crimson)]">{source.ref} · 推荐资料</span>
                  <span className="truncate text-[rgba(23,23,25,0.4)]">{source.displayCategory ?? source.category}</span>
                </div>
                <strong className="mt-1 block text-sm leading-snug">{source.title}</strong>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[rgba(23,23,25,0.55)]">{source.displaySummary}</p>
                <span className="mt-2 block text-xs text-[#1a5f80]">打开 GitHub 原文件 ↗</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <p className="px-1 text-xs text-[rgba(23,23,25,0.4)]">
        {reply.generation?.mode === "rag"
          ? `已使用 ${reply.generation.model ?? "大模型"} 基于本轮检索依据生成`
          : reply.generation?.note ?? "本轮使用规则检索与回答"}
      </p>
    </div>
  );
}

export default function ChatMessage({ turn, resources, onOpen, onSave }: ChatMessageProps) {
  const isUser = turn.role === "user";
  const recs = turn.recommendationIds
    ? resources.filter((r) => turn.recommendationIds!.includes(r.id))
    : [];

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-md bg-[var(--color-ink)] text-[var(--color-paper)] rounded-2xl rounded-tr-sm px-5 py-3.5 text-sm font-body leading-relaxed">
          {turn.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-3">
      {/* AI avatar */}
      <div className="w-8 h-8 rounded-full bg-[var(--color-indigo)] flex items-center justify-center flex-shrink-0 mt-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.27-6.73-2.12 2.12M6.39 17.61l-2.12 2.12m0-14.46 2.12 2.12M17.61 17.61l2.12 2.12" />
        </svg>
      </div>

      <div className="flex flex-col gap-3 max-w-xl">
        <div className="bg-white border border-[var(--color-border)] rounded-2xl rounded-tl-sm px-5 py-4 text-sm font-body text-[var(--color-ink)] leading-relaxed flex flex-col gap-1">
          {renderMarkdown(turn.content)}
        </div>

        <AdvisorDetails turn={turn} />

        {recs.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {recs.map((item) => (
              <EmbeddedCard key={item.id} item={item} onOpen={onOpen} onSave={onSave} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
