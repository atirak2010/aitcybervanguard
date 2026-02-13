import React, { createContext, useContext, useState, useCallback } from "react";
import { User, UserRole, ROLE_PERMISSIONS, Permission } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: Record<UserRole, User> = {
  analyst: { id: "1", name: "Sarah Chen", email: "sarah.chen@csoc.local", role: "analyst" },
  manager: { id: "2", name: "James Rodriguez", email: "james.r@csoc.local", role: "manager" },
  admin: { id: "3", name: "Alex Morgan", email: "alex.m@csoc.local", role: "admin" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((role: UserRole) => {
    setUser(MOCK_USERS[role]);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!user) return false;
      return ROLE_PERMISSIONS[user.role][permission];
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
