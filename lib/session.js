const TOKEN_STORAGE_KEY = "token";
const CURRENT_USER_STORAGE_KEY = "currentUser";

const isBrowser = () => typeof window !== "undefined";

export function getStoredToken() {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser() {
  if (!isBrowser()) return null;

  const value = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function setStoredSession(token, user) {
  if (!isBrowser()) return;

  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  if (user) {
    window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
  }
}

export function updateStoredUser(user) {
  if (!isBrowser() || !user) return;

  const current = getStoredUser() || {};
  window.localStorage.setItem(
    CURRENT_USER_STORAGE_KEY,
    JSON.stringify({ ...current, ...user })
  );
}

export function clearStoredSession() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  window.sessionStorage.clear();
}

export function hasStoredSession() {
  return Boolean(getStoredToken() && getStoredUser());
}
