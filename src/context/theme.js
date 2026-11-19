export const THEME_STORAGE_KEY = 'belia_theme';

export function readTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.warn('No se pudo leer la preferencia de tema.', error);
    return 'light';
  }
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('No se pudo guardar la preferencia de tema.', error);
  }
}
