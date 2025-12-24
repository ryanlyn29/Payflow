
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserPreferences } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (prefs: UserPreferences) => Promise<void>;
  updateUser: () => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);

        try {
          const freshUser = await authService.getCurrentUserFromAPI();
          setUser(freshUser);

          if (freshUser.preferences?.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch (error: any) {

          if (error.code !== 'ERR_NETWORK' && !error.message?.includes('ERR_CONNECTION_REFUSED')) {
            console.warn('Failed to refresh user data, using stored user:', error);
          }
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setUser(res.user);
  };

  const loginWithOAuth = async (accessToken: string, refreshToken: string) => {

    localStorage.setItem('paysignal_auth_token', accessToken);
    localStorage.setItem('paysignal_refresh_token', refreshToken);

    const user = await authService.getCurrentUserFromAPI();
    setUser(user);

    if (user.preferences?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updatePreferences = async (prefs: UserPreferences) => {
    const updated = await authService.updatePreferences(prefs);
    setUser(updated);
    if (prefs.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const updateUser = async () => {
    try {
      const freshUser = await authService.getCurrentUserFromAPI();
      setUser(freshUser);
      return freshUser;
    } catch (error: any) {

      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
        return storedUser;
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithOAuth, logout, updatePreferences, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
