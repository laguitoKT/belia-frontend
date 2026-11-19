import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyTheme, readTheme, saveTheme, THEME_STORAGE_KEY } from './theme.js';

test('el tema se guarda, se recupera y se aplica al documento', () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  globalThis.document = { documentElement: { dataset: {} } };

  try {
    assert.equal(readTheme(), 'light');
    saveTheme('dark');
    assert.equal(values.get(THEME_STORAGE_KEY), 'dark');
    assert.equal(readTheme(), 'dark');
    applyTheme(readTheme());
    assert.equal(document.documentElement.dataset.theme, 'dark');
    saveTheme('light');
    assert.equal(readTheme(), 'light');
    values.set(THEME_STORAGE_KEY, 'invalid');
    assert.equal(readTheme(), 'light');
  } finally {
    delete globalThis.localStorage;
    delete globalThis.document;
  }
});
