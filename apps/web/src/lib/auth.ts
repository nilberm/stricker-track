export const accessTokenKey = 'sticker-track-access-token';
export const authStateEvent = 'sticker-track-auth-state';

export function notifyAuthStateChanged() {
  window.dispatchEvent(new Event(authStateEvent));
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  preferredLocale: 'pt-BR' | 'en' | 'es';
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};
