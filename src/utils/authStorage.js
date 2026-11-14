export const STORAGE_USER_KEY = 'belia_current_user';
export const STORAGE_TOKEN_KEY = 'belia_access_token';
export const STORAGE_AUTH_SOURCE_KEY = 'belia_auth_source';
export const SESSION_EXPIRED_EVENT = 'belia:session-expired';

export const clearAuthStorage = () => {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
  localStorage.removeItem(STORAGE_AUTH_SOURCE_KEY);
};
