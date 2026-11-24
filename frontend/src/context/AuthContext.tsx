import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api.js';
import { User } from '../types/index.js';

interface MfaChallenge {
  email: string;
  tempToken: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  mfaChallenge: MfaChallenge | null;
  login: (credentials: { email: string; password: string }) => Promise<{ mfaRequired?: boolean }>;
  completeMfa: (code: string, isRecoveryCode?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  hasRole: (...roles: string[]) => boolean;
  refreshUser: () => Promise<void>;
  clearMfaChallenge: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);

  const refreshUser = async () => {
    try {
      const data = await authApi.getMe();
      if (data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authApi.login(credentials);
    if (res?.mfaRequired) {
      setMfaChallenge({ email: res.email, tempToken: res.tempToken });
      return { mfaRequired: true };
    }

    if (res?.accessToken) {
      localStorage.setItem('accessToken', res.accessToken);
      setUser(res.user);
    }
    return { mfaRequired: false };
  };

  const completeMfa = async (code: string, isRecoveryCode = false) => {
    if (!mfaChallenge) throw new Error('No active MFA challenge.');

    const res = await authApi.verifyMfa({
      email: mfaChallenge.email,
      tempToken: mfaChallenge.tempToken,
      code,
      isRecoveryCode
    });

    if (res?.accessToken) {
      localStorage.setItem('accessToken', res.accessToken);
      setUser(res.user);
      setMfaChallenge(null);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      setMfaChallenge(null);
    }
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permissionCode);
  };

  const hasRole = (...roles: string[]): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) => roles.includes(r));
  };

  const clearMfaChallenge = () => {
    setMfaChallenge(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        mfaChallenge,
        login,
        completeMfa,
        logout,
        hasPermission,
        hasRole,
        refreshUser,
        clearMfaChallenge
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
