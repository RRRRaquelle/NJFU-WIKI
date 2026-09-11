import { useEffect } from "react";
import { ResourceItem } from "../../data/mock";
import Button from "../ui/Button";
import Chip from "../ui/Chip";

interface ResourceDrawerProps {
  item: ResourceItem;
  onClose: () => void;
  onSave: (id: string) => void;
}

export default function ResourceDrawer({ item, onClose, onSave }: ResourceDrawerProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-[rgba(23,23,25,0.3)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="w-full max-w-xl bg-[var(--color-paper)] h-full flex flex-col shadow-2xl animate-slide-in overflow-hidden">
        <style>{`
          @keyframes slide-in {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--color-border)]">
          <span className="text-sm font-body text-[rgba(23,23,25,0.5)]">资料详情</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgba(23,23,25,0.08)] transition-colors"
            aria-label="关闭"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
          {/* Type + stage */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium font-body bg-[rgba(23,23,25,0.08)] text-[var(--color-ink)]">
              {item.type}
            </span>
            <span className="text-sm text-[rgba(23,23,25,0.5)] font-body">{item.stage}</span>
          </div>

          {/* Title */}
          <h2 className="font-serif font-bold text-2xl text-[var(--color-ink)] leading-snug">
            {item.title}
          </h2>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-[rgba(23,23,25,0.5)] font-body">
            <span>贡献者：{item.contributor}</span>
            <span>·</span>
            <span>更新于 {item.updatedAt}</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <Chip key={tag} label={tag} />
            ))}
          </div>

          {/* Summary */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[rgba(23,23,25,0.45)] font-body mb-2">摘要</h4>
            <p className="text-base text-[var(--color-ink)] font-body leading-relaxed">
              {item.summary}
            </p>
          </div>

          {/* Full text preview */}
          {item.fullText && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[rgba(23,23,25,0.45)] font-body mb-2">正文预览</h4>
              <p className="text-base text-[rgba(23,23,25,0.75)] font-body leading-relaxed">
                {item.fullText}
              </p>
            </div>
          )}

          {/* Source */}
          {item.sourceUrl && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[rgba(23,23,25,0.45)] font-body mb-2">来源</h4>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-[#1a5f80] font-body break-all hover:underline"
              >
                在 NJFU-CS/NJFU-Courses 中打开原文件 ↗
              </a>
            </div>
          )}

          <div className="border border-dashed border-[var(--color-border-strong)] rounded-[var(--radius-ctrl)] p-4 flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[rgba(23,23,25,0.4)] flex-shrink-0">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
            </svg>
            <span className="text-sm text-[rgba(23,23,25,0.45)] font-body">文件由 GitHub 仓库托管，本产品只维护可检索的资料目录。</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-[var(--color-border)] flex items-center justify-between">
          <Button variant="text" size="sm" onClick={onClose}>
            关闭
          </Button>
          <Button
            variant={item.isSaved ? "secondary" : "primary"}
            size="md"
            onClick={() => onSave(item.id)}
          >
            {item.isSaved ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                已收藏
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                收藏资料
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
