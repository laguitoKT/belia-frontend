const INITIALS_THEMES = [
  { background: 'bg-brand-primary', text: 'text-white' },
  { background: 'bg-brand-accent', text: 'text-white' },
  { background: 'bg-brand-secondary', text: 'text-white' },
  { background: 'bg-brand-light', text: 'text-brand-primary' },
  { background: 'bg-brand-soft', text: 'text-brand-primary' },
];

export const getInitialsTheme = (value = '') => {
  const normalizedValue = String(value);
  const hash = [...normalizedValue].reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );

  return INITIALS_THEMES[hash % INITIALS_THEMES.length];
};
