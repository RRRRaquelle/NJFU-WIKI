import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "text" | "icon";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-crimson)] active:scale-[0.97] rounded-[var(--radius-ctrl)]",
    secondary:
      "bg-transparent border border-[var(--color-border-strong)] text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[rgba(23,23,25,0.04)] active:scale-[0.97] rounded-[var(--radius-ctrl)]",
    text:
      "bg-transparent text-[var(--color-ink)] hover:text-[var(--color-crimson)] underline-offset-2 hover:underline active:opacity-70",
    icon:
      "bg-transparent text-[var(--color-ink)] hover:bg-[rgba(23,23,25,0.06)] active:scale-[0.93] rounded-full",
  };

  const sizes = {
    sm: variant === "icon" ? "w-8 h-8" : "px-3 py-1.5 text-sm",
    md: variant === "icon" ? "w-10 h-10" : "px-5 py-2.5 text-base",
    lg: variant === "icon" ? "w-12 h-12" : "px-7 py-3.5 text-lg",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
