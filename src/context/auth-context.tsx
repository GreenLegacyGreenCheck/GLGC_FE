"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AuthUser = {
  id: string;
  email: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

const initialState: AuthState = {
  token: null,
  user: null,
};

// 로그인 상태는 새 탭/새로고침에도 유지돼야 해서 localStorage에 보관한다
// (진단 결과는 같은 세션 안에서만 유지하면 돼서 sessionStorage를 쓰는 것과 다름).
const STORAGE_KEY = "glgc-auth";

function readPersistedState(): AuthState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export type AuthContextValue = AuthState & {
  // Provider가 localStorage를 아직 읽어오기 전까지는 true로, 페이지들이 이
  // 값을 보고 hydration이 끝나기 전에 비로그인 상태로 잘못 렌더링하지 않도록 한다.
  isHydrated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const persisted = readPersistedState();
    if (persisted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(persisted);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isHydrated, state]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isHydrated,
      login: (token, user) => setState({ token, user }),
      logout: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setState(initialState);
      },
    }),
    [state, isHydrated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
