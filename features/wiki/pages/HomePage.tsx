import { useEffect, useRef, useState } from "react";
import UserMenu from "../components/ui/UserMenu";

const bgWhite = "/figma/home-paper.png";
const bgBlue = "/figma/home-sky.png";
const bgCloud = "/figma/home-cloud.png";

interface Theme {
  label: string;
  bg: string;
  titleColor: string;
  subtitleColor: string;
  navColor: string;
  loginBg: string;
  loginText: string;
  dotActive: string;
}

const themes: Theme[] = [
  {
    // State 0 — green cloud / navy
    label: "绿色",
    bg: bgCloud,
    titleColor: "#143c55",
    subtitleColor: "#143c55",
    navColor: "#171719",
    loginBg: "#143c55",
    loginText: "#fcf8f8",
    dotActive: "#143c55",
  },
  {
    // State 1 — grayscale paper / crimson
    label: "灰色",
    bg: bgWhite,
    titleColor: "#b5262c",
    subtitleColor: "#b5262c",
    navColor: "#171719",
    loginBg: "#b5262c",
    loginText: "#f2f0ea",
    dotActive: "#b5262c",
  },
  {
    // State 2 — blue sky / white
    label: "蓝色",
    bg: bgBlue,
    titleColor: "#fcfbfb",
    subtitleColor: "#fefbfb",
    navColor: "#ffffff",
    loginBg: "#fcf9f9",
    loginText: "#333333",
    dotActive: "#fcf9f9",
  },
];

const HOME_THEME_INTERVAL_MS = 3500;
const HOME_THEME_FADE_MS = 520;

interface HomePageProps {
  onNavigate: (page: string) => void;
  onLogin: () => void;
  onLogout: () => void;
  isLoggedIn: boolean;
  username: string;
}

export default function HomePage({ onNavigate, onLogin, onLogout, isLoggedIn, username }: HomePageProps) {
  const [themeIndex, setThemeIndex] = useState(0);
  const [previousThemeIndex, setPreviousThemeIndex] = useState<number | null>(null);
  const reducedMotion = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  const theme = themes[themeIndex];

  useEffect(() => {
    if (reducedMotion.current) return;
    const timeout = setTimeout(() => {
      setPreviousThemeIndex(themeIndex);
      setThemeIndex((themeIndex + 1) % themes.length);
    }, HOME_THEME_INTERVAL_MS);
    return () => clearTimeout(timeout);
  }, [themeIndex]);

  const selectTheme = (index: number) => {
    if (index === themeIndex) return;
    setPreviousThemeIndex(themeIndex);
    setThemeIndex(index);
  };

  const navItems = [
    { label: "发现", page: "discover" },
    { label: "收藏", page: "collections" },
    { label: "贡献", page: "contribute" },
    { label: "我的", page: "me" },
  ];

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: "100%", minHeight: "100vh" }}
    >
      {/* ── Layer 1: Background images — one per theme, stacked, cross-fade ── */}
      {themes.map((t, i) => (
        <img
          key={i}
          src={t.bg}
          alt=""
          aria-hidden="true"
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          style={{
            opacity: themeIndex === i || previousThemeIndex === i ? 1 : 0,
            transition: reducedMotion.current || themeIndex !== i
              ? "none"
              : `opacity ${HOME_THEME_FADE_MS}ms ease-in-out`,
            zIndex: themeIndex === i ? 1 : previousThemeIndex === i ? 0 : -1,
            willChange: "opacity",
          }}
        />
      ))}

      {/* ── Fixed 1280-wide canvas for text + UI ── */}
      <div
        className="relative mx-auto"
        style={{
          width: "100%",
          maxWidth: 1280,
          height: "clamp(600px, 65vw, 832px)",
        }}
      >
        {/* ── Layer 2: Title + subtitle ── */}

        {/* Subtitle tagline + CTA */}
        <div
          className="absolute flex flex-col"
          style={{ left: 84, top: 136, width: 360, zIndex: 10, alignItems: "flex-start" }}
        >
          <p
            style={{
              fontFamily: "'Instrument Serif:Regular', 'Instrument Serif', serif",
              fontSize: "clamp(30px, 2.1vw, 34px)",
              lineHeight: 1.1,
              color: theme.subtitleColor,
              transition: "color 120ms ease-out",
              fontStyle: "normal",
              textAlign: "left",
              margin: 0,
            }}
          >
            <span style={{ display: "block" }}>Leave the path you&apos;ve walked</span>
            <span style={{ display: "block" }}>for those who follow.</span>
          </p>

          {/* CTA button */}
          <button
            onClick={() => onNavigate("discover")}
            style={{
              marginTop: 18,
              height: 42,
              padding: "0 20px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 15,
              fontFamily: "'Inter:Medium', 'Inter', 'Noto Sans SC', sans-serif",
              fontWeight: 500,
              borderRadius: 6,
              border: `1.5px solid ${theme.loginBg}`,
              backgroundColor: "transparent",
              color: theme.loginBg,
              cursor: "pointer",
              transition: "background-color 140ms ease, color 140ms ease, transform 120ms ease",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.backgroundColor = theme.loginBg;
              el.style.color = theme.loginText;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.backgroundColor = "transparent";
              el.style.color = theme.loginBg;
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onFocus={(e) => {
              e.currentTarget.style.outline = `2px solid ${theme.loginBg}`;
              e.currentTarget.style.outlineOffset = "2px";
            }}
            onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
          >
            开始探索 →
          </button>
        </div>

        {/* Large "NJFU WIKI" heading */}
        <div
          className="absolute overflow-clip"
          style={{ left: 376, top: 128, width: 1242, height: 141, zIndex: 10 }}
        >
          <p
            className="absolute whitespace-nowrap select-none"
            style={{
              fontFamily: "'Cormorant Garamond:Bold Italic', 'Cormorant Garamond', serif",
              fontSize: 140.781,
              lineHeight: "140.781px",
              letterSpacing: "-2.8156px",
              fontWeight: 700,
              fontStyle: "italic",
              color: theme.titleColor,
              left: 91,
              top: -14,
              transition: "color 120ms ease-out",
            }}
          >
            NJFU WIKI
          </p>
        </div>

        {/* ── Layer 3: Navigation header (grid: logo | nav | login) ── */}
        <div
          className="absolute top-0 left-0 w-full"
          style={{
            padding: "30px 32px 0",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            zIndex: 20,
          }}
        >
          {/* Logo — left */}
          <button
            onClick={() => onNavigate("home")}
            className="font-bold italic whitespace-nowrap hover:opacity-80 transition-opacity duration-100"
            style={{
              justifySelf: "start",
              fontFamily: "'Cormorant Garamond:Bold Italic', 'Cormorant Garamond', serif",
              fontSize: 20,
              lineHeight: "28px",
              letterSpacing: "-0.5px",
              color: theme.navColor,
              transition: "color 120ms ease-out",
            }}
          >
            NJFU WIKI
          </button>

          {/* Nav links — center */}
          <nav
            className="flex items-center"
            style={{ justifySelf: "center", gap: "clamp(32px, 3vw, 48px)" }}
          >
            {navItems.map(({ label, page }) => (
              <button
                key={label}
                onClick={() => onNavigate(page)}
                className="font-medium text-sm whitespace-nowrap hover:opacity-70 transition-opacity duration-100"
                style={{
                  fontFamily: "'Inter:Medium', 'Inter', 'Noto Sans SC', sans-serif",
                  color: theme.navColor,
                  transition: "color 120ms ease-out",
                  lineHeight: "20px",
                }}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Account area — right */}
          <div style={{ justifySelf: "end" }}>
            {isLoggedIn ? (
              <UserMenu
                username={username}
                onLogout={onLogout}
                onProfile={() => onNavigate("me")}
                color={theme.navColor}
                avatarBg={theme.loginBg}
                avatarText={theme.loginText}
              />
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center justify-center rounded-[12px] font-medium text-base whitespace-nowrap hover:opacity-90 active:scale-[0.97] transition-transform duration-100"
                style={{
                  fontFamily: "'Inter:Medium', 'Inter', 'Noto Sans SC', sans-serif",
                  backgroundColor: theme.loginBg,
                  color: theme.loginText,
                  height: 32,
                  width: 82,
                  lineHeight: "24px",
                  transition: "background-color 120ms ease-out, color 120ms ease-out",
                }}
              >
                登录
              </button>
            )}
          </div>
        </div>

        {/* Theme switcher dots */}
        <div
          className="absolute flex items-center gap-3"
          style={{ left: 84, bottom: 40, zIndex: 20 }}
        >
          {themes.map((themeOption, i) => (
            <button
              key={i}
              onClick={() => selectTheme(i)}
              aria-label={`切换到${themeOption.label}主题`}
              style={{
                width: themeIndex === i ? 32 : 10,
                height: 10,
                borderRadius: 5,
                backgroundColor:
                  themeIndex === i
                    ? theme.dotActive
                    : "rgba(23,23,25,0.25)",
                transition: "width 200ms ease, background-color 120ms ease-out",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
