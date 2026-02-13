import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { User, ROLE_PERMISSIONS, Permission } from "@/types/auth";
import { db, hashPassword, seedDefaultAdmin } from "@/db/csocDatabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "csoc-session-user-id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage + seed default admin on first load
  useEffect(() => {
    (async () => {
      await seedDefaultAdmin();
      const storedId = localStorage.getItem(SESSION_KEY);
      if (storedId) {
        const stored = await db.users.get(storedId);
        if (stored) {
          setUser({ id: stored.id, name: stored.name, email: stored.email, role: stored.role });
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const stored = await db.users.where("email").equals(email.trim().toLowerCase()).first();
    if (!stored) return { ok: false, error: "Invalid email or password" };

    const inputHash = await hashPassword(password);
    if (inputHash !== stored.passwordHash) return { ok: false, error: "Invalid email or password" };

    const u: User = { id: stored.id, name: stored.name, email: stored.email, role: stored.role };
    setUser(u);
    localStorage.setItem(SESSION_KEY, u.id);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!user) return false;
      return ROLE_PERMISSIONS[user.role][permission];
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
