import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { UserRole } from '@cas/shared';
import i18n from '../i18n';
import { FontScale } from '../theme/theme';

export type AppModule = 'GREEN_ZONE' | 'MIS' | 'TREES' | 'MASTERS';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  role: UserRole;
  businessIds: string[];
  locationIds: string[];
  siteLocationIds: string[];
  businesses?: any[];
  locations?: any[];
  siteLocations?: any[];
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  activeModule: AppModule;
  setActiveModule: (mod: AppModule) => void;
  devModalOpen: boolean;
  setDevModalOpen: (open: boolean) => void;
  devLogin: (userId: string) => Promise<void>;
  logout: () => void;
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  language: 'en' | 'hi';
  toggleLanguage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<AppModule>('GREEN_ZONE');
  const [devModalOpen, setDevModalOpen] = useState(false);

  // Accessibility States (persisted in localStorage)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('cas_theme') as 'light' | 'dark') || 'light';
  });

  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    return (localStorage.getItem('cas_font_scale') as FontScale) || 'medium';
  });

  const [language, setLanguageState] = useState<'en' | 'hi'>(() => {
    return (localStorage.getItem('cas_lang') as 'en' | 'hi') || 'en';
  });

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('cas_token');
      if (!token) {
        setLoading(false);
        setDevModalOpen(true);
        return;
      }
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      localStorage.removeItem('cas_token');
      setUser(null);
      setDevModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const devLogin = async (userId: string) => {
    const res = await api.post('/auth/dev-login', { userId });
    localStorage.setItem('cas_token', res.data.accessToken);
    setUser(res.data.user);
    setDevModalOpen(false);
    await fetchCurrentUser();
  };

  const logout = () => {
    localStorage.removeItem('cas_token');
    setUser(null);
    setDevModalOpen(true);
  };

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    localStorage.setItem('cas_theme', next);
  };

  const setFontScale = (scale: FontScale) => {
    setFontScaleState(scale);
    localStorage.setItem('cas_font_scale', scale);
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'hi' : 'en';
    setLanguageState(next);
    localStorage.setItem('cas_lang', next);
    i18n.changeLanguage(next);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        activeModule,
        setActiveModule,
        devModalOpen,
        setDevModalOpen,
        devLogin,
        logout,
        themeMode,
        toggleTheme,
        fontScale,
        setFontScale,
        language,
        toggleLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
