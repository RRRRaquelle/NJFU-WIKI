import { FormEvent, useState } from "react";
import UserMenu from "../ui/UserMenu";

type PageKey = "discover" | "collections" | "contribute" | "me";

interface InnerNavProps {
  currentPage: PageKey;
  onNavigate: (page: string, state?: string, query?: string) => void;
  onSearch: (query: string) => void;
  defaultQuery?: string;
  isLoggedIn?: boolean;
  username?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

const navItems: { label: string; key: PageKey }[] = [
  { label: "发现", key: "discover" },
  { label: "收藏", key: "collections" },
  { label: "贡献", key: "contribute" },
  { label: "我的", key: "me" },
];

export default function InnerNav({
  currentPage,
  onNavigate,
  onSearch,
  defaultQuery = "",
  isLoggedIn = false,
  username = "",
  onLogin,
  onLogout,
}: InnerNavProps) {
  const [query, setQuery] = useState(defaultQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[rgba(242,240,234,0.93)] border-b border-[var(--color-border)] backdrop-blur-sm">
      <div className="flex items-center gap-6 px-[clamp(24px,3.5vw,64px)] h-16">
        {/* Brand */}
        <button
          onClick={() => onNavigate("home")}
          className="font-display italic text-lg font-bold tracking-tight text-[var(--color-ink)] whitespace-nowrap hover:text-[var(--color-crimson)] transition-colors"
        >
          NJFU WIKI
        </button>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-xl">
          <div className="relative flex items-center">
            <svg
              className="absolute left-3 text-[rgba(23,23,25,0.4)] pointer-events-none"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索课程、竞赛、升学、就业资料…"
              className="w-full pl-9 pr-4 py-2 bg-white border border-[var(--color-border)] rounded-[var(--radius-ctrl)] text-sm font-body text-[var(--color-ink)] placeholder:text-[rgba(23,23,25,0.35)] focus:outline-none focus:border-[var(--color-ink)] transition-colors"
            />
          </div>
        </form>

        {/* Nav items */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium font-body transition-all duration-150 ${
                currentPage === key
                  ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "text-[var(--color-ink)] hover:bg-[rgba(23,23,25,0.06)]"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Account area */}
        <div className="ml-auto flex-shrink-0">
          {isLoggedIn ? (
            <UserMenu
              username={username}
              onLogout={onLogout ?? (() => {})}
              onProfile={() => onNavigate("me")}
            />
          ) : (
            <button
              onClick={onLogin}
              className="px-4 py-1.5 rounded-[var(--radius-ctrl)] text-sm font-medium font-body bg-[var(--color-ink)] text-[var(--color-paper)] hover:opacity-90 transition-opacity"
            >
              登录
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
