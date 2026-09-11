import { ResourceItem } from "../../data/mock";
import Chip from "./Chip";

interface ResourceCardProps {
  item: ResourceItem;
  onOpen: (item: ResourceItem) => void;
  onSave: (id: string) => void;
  compact?: boolean;
}

const typeColors: Record<ResourceItem["type"], string> = {
  课程: "bg-[rgba(115,188,232,0.2)] text-[#1a5f80]",
  竞赛: "bg-[rgba(242,154,5,0.15)] text-[#8a5800]",
  升学: "bg-[rgba(41,40,68,0.1)] text-[var(--color-indigo)]",
  就业: "bg-[rgba(41,40,68,0.1)] text-[var(--color-indigo)]",
  经验: "bg-[rgba(181,38,44,0.1)] text-[var(--color-crimson)]",
  路线: "bg-[rgba(216,234,227,0.8)] text-[#1a5040]",
};

export default function ResourceCard({ item, onOpen, onSave, compact = false }: ResourceCardProps) {
  return (
    <div
      className="group relative bg-white border border-[var(--color-border)] rounded-[var(--radius-card)] p-6 flex flex-col gap-3 cursor-pointer hover:shadow-[0_4px_24px_rgba(23,23,25,0.10)] hover:-translate-y-0.5 transition-all duration-200"
      onClick={() => onOpen(item)}
    >
      {/* Type badge */}
      <div className="flex items-center justify-between">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium font-body ${typeColors[item.type]}`}>
          {item.type}
        </span>
        <span className="text-xs text-[rgba(23,23,25,0.4)] font-body">{item.stage}</span>
      </div>

      {/* Title */}
      <h3 className={`font-serif font-bold leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-crimson)] transition-colors ${compact ? "text-base" : "text-lg"}`}>
        {item.title}
      </h3>

      {/* Summary */}
      {!compact && (
        <p className="text-sm text-[rgba(23,23,25,0.65)] font-body line-clamp-2 leading-relaxed">
          {item.summary}
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {item.tags.slice(0, 3).map((tag) => (
          <Chip key={tag} label={tag} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 mt-auto border-t border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-xs text-[rgba(23,23,25,0.45)] font-body">
          <span>{item.contributor}</span>
          <span>·</span>
          <span>{item.updatedAt === "仓库现有" ? item.updatedAt : item.updatedAt.slice(0, 7)}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave(item.id);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgba(181,38,44,0.08)] transition-colors"
          aria-label={item.isSaved ? "取消收藏" : "收藏"}
        >
          {item.isSaved ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-crimson)">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
