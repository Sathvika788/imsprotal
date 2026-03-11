import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const getThemeColors = (theme: Theme) => {
  const colors = ({
    // Light mode
    light: {
      bg: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9',
        accent: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      text: {
        primary: '#1f2937',
        secondary: '#6b7280',
        tertiary: '#9ca3af',
      },
      border: '#e5e7eb',
      card: '#ffffff',
      shadow: 'rgba(0, 0, 0, 0.08)',
    },
    // Dark mode
    dark: {
      bg: {
        primary: '#0f172a',
        secondary: '#1a202c',
        tertiary: '#2d3748',
        accent: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      text: {
        primary: '#f8fafc',
        secondary: '#cbd5e1',
        tertiary: '#94a3b8',
      },
      border: '#334155',
      card: '#1a202c',
      shadow: 'rgba(0, 0, 0, 0.3)',
    },
  })[theme === 'light' ? 'light' : 'dark'];

  return {
    ...colors,
    // Semantic colors
    background: colors.bg.secondary,
    foreground: colors.text.primary,
    cardBg: colors.card,
    success: '#16a34a',
    danger: '#dc2626',
    warning: '#d97706',
    info: '#0ea5e9',
    primary: '#667eea',
    secondary: colors.text.secondary,
  };
};
