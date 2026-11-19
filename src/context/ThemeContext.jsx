import { useEffect, useState } from 'react';
import ThemeContext from './themeContextValue';
import { applyTheme, readTheme, saveTheme, THEME_STORAGE_KEY } from './theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) {
        const nextTheme = readTheme();
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    saveTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
