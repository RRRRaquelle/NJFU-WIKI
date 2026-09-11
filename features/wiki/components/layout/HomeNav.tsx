import Button from "../ui/Button";

interface HomeNavProps {
  onNavigate: (page: string) => void;
  onLogin: () => void;
  themeIndex: number;
  themeBg: string;
}

export default function HomeNav({ onNavigate, onLogin, themeIndex, themeBg }: HomeNavProps) {
  const isDark = themeIndex === 1;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[rgba(255,255,255,0.15)] transition-colors duration-700"
      style={{ backgroundColor: `${themeBg}ee`, backdropFilter: "blur(12px)" }}
    >
      <div className="flex items-center justify-between px-[clamp(32px,4vw,64px)] h-16">
        {/* Brand */}
        <button
          onClick={() => onNavigate("home")}
          className={`font-display italic text-xl font-bold tracking-tight transition-colors duration-700 ${isDark ? "text-white" : "text-[var(--color-ink)]"}`}
        >
          NJFU WIKI
        </button>

        {/* Middle nav */}
        <nav className="flex items-center gap-8">
          {["发现", "收藏", "贡献", "我的"].map((item) => {
            const pageMap: Record<string, string> = { 发现: "discover", 收藏: "collections", 贡献: "contribute", 我的: "me" };
            return (
              <button
                key={item}
                onClick={() => onNavigate(pageMap[item])}
                className={`text-sm font-medium font-body transition-all duration-200 hover:opacity-70 ${isDark ? "text-white" : "text-[var(--color-ink)]"}`}
              >
                {item}
              </button>
            );
          })}
        </nav>

        {/* Login */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onLogin}
          className={isDark ? "!text-white !border-white/40 hover:!bg-white/10" : ""}
        >
          登录
        </Button>
      </div>
    </header>
  );
}
