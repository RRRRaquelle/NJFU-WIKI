import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthState {
  isLoggedIn: boolean;
  username: string;
}

interface AuthContextValue extends AuthState {
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "njfu_wiki_auth";

function readStorage(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AuthState;
  } catch {}
  return { isLoggedIn: false, username: "" };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ isLoggedIn: false, username: "" });

  useEffect(() => {
    setState(readStorage());
  }, []);

  const login = (username: string) => {
    const next: AuthState = { isLoggedIn: true, username };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const logout = () => {
    const next: AuthState = { isLoggedIn: false, username: "" };
    setState(next);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
