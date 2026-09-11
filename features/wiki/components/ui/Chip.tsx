interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  variant?: "filter" | "tag";
}

export default function Chip({ label, active = false, onClick, variant = "tag" }: ChipProps) {
  if (variant === "filter") {
    return (
      <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-full text-sm font-medium font-body transition-all duration-150 cursor-pointer border ${
          active
            ? "bg-[var(--color-ink)] text-[var(--color-paper)] border-[var(--color-ink)]"
            : "bg-transparent text-[var(--color-ink)] border-[var(--color-border-strong)] hover:border-[var(--color-ink)] hover:bg-[rgba(23,23,25,0.04)]"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body bg-[rgba(23,23,25,0.07)] text-[var(--color-ink)]">
      {label}
    </span>
  );
}
