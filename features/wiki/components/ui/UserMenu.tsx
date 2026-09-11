import { useEffect, useRef, useState } from "react";

interface UserMenuProps {
  username: string;
  onLogout: () => void;
  onProfile?: () => void;
  /** Text color for name and chevron (used on themed homepage) */
  color?: string;
  /** Avatar background color */
  avatarBg?: string;
  /** Avatar text color */
  avatarText?: string;
}

export default function UserMenu({
  username,
  onLogout,
  onProfile,
  color = "var(--color-ink)",
  avatarBg = "var(--color-ink)",
  avatarText = "var(--color-paper)",
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const initial = username.charAt(0).toUpperCase() || "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-100"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Avatar circle */}
        <span
          className="flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0"
          style={{
            width: 28,
            height: 28,
            backgroundColor: avatarBg,
            color: avatarText,
            fontFamily: "'Inter:Medium', 'Inter', sans-serif",
            transition: "background-color 120ms ease-out",
          }}
        >
          {initial}
        </span>

        {/* Username */}
        <span
          className="text-sm font-medium"
          style={{
            color,
            fontFamily: "'Inter:Medium', 'Inter', 'Noto Sans SC', sans-serif",
            maxWidth: 120,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            transition: "color 120ms ease-out",
          }}
        >
          {username}
        </span>

        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{ color, flexShrink: 0, transition: "color 120ms ease-out, transform 150ms ease" , transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-36 rounded-xl bg-white shadow-xl border border-[var(--color-border)] overflow-hidden z-[300]"
          style={{ top: "100%" }}
        >
          <button
            onClick={() => { setOpen(false); onProfile?.(); }}
            className="w-full text-left px-4 py-2.5 text-sm font-body text-[var(--color-ink)] hover:bg-[rgba(23,23,25,0.06)] transition-colors"
          >
            个人主页
          </button>
          <div className="h-px bg-[var(--color-border)] mx-3" />
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="w-full text-left px-4 py-2.5 text-sm font-body text-[#b5262c] hover:bg-[rgba(181,38,44,0.06)] transition-colors"
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
