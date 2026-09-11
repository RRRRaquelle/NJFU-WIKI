import { useEffect, useRef, useState, FormEvent } from "react";
import Button from "../ui/Button";

interface LoginModalProps {
  onSuccess: (username: string) => void;
  onClose: () => void;
}

export default function LoginModal({ onSuccess, onClose }: LoginModalProps) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [accountError, setAccountError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    let valid = true;

    if (!account.trim()) {
      setAccountError("请输入学号或邮箱");
      valid = false;
    } else {
      setAccountError("");
    }

    if (!password.trim()) {
      setPasswordError("请输入密码");
      valid = false;
    } else {
      setPasswordError("");
    }

    if (!valid) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess(account.trim());
    }, 650);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(23,23,25,0.4)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-[var(--color-paper)] rounded-[var(--radius-card)] p-8 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgba(23,23,25,0.08)] transition-colors"
          aria-label="关闭"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Heading */}
        <div className="mb-6">
          <h2 className="font-display italic text-3xl font-bold text-[var(--color-ink)]">登录</h2>
          <p className="text-sm text-[rgba(23,23,25,0.5)] font-body mt-1">南林计算机学院知识平台</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium font-body text-[var(--color-ink)]">学号 / 邮箱</label>
            <input
              ref={firstInputRef}
              type="text"
              value={account}
              onChange={(e) => { setAccount(e.target.value); if (accountError) setAccountError(""); }}
              placeholder="输入学号或邮箱"
              className={`px-4 py-3 bg-white border rounded-[var(--radius-ctrl)] text-sm font-body focus:outline-none transition-colors ${
                accountError ? "border-[#b5262c] focus:border-[#b5262c]" : "border-[var(--color-border)] focus:border-[var(--color-ink)]"
              }`}
            />
            {accountError && (
              <p className="text-xs text-[#b5262c] font-body">{accountError}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium font-body text-[var(--color-ink)]">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(""); }}
              placeholder="输入密码"
              className={`px-4 py-3 bg-white border rounded-[var(--radius-ctrl)] text-sm font-body focus:outline-none transition-colors ${
                passwordError ? "border-[#b5262c] focus:border-[#b5262c]" : "border-[var(--color-border)] focus:border-[var(--color-ink)]"
              }`}
            />
            {passwordError && (
              <p className="text-xs text-[#b5262c] font-body">{passwordError}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="mt-2 w-full justify-center"
            disabled={loading}
          >
            {loading ? "登录中…" : "登录"}
          </Button>
        </form>

        <p className="text-xs text-center text-[rgba(23,23,25,0.4)] font-body mt-4">
          原型演示：任意输入即可登录
        </p>
      </div>
    </div>
  );
}
