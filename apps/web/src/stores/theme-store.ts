import { create } from 'zustand';

type ThemeState = {
  activeTheme: string;
  setTheme: (theme: string) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  activeTheme: 'default',
  setTheme: (theme) => set({ activeTheme: theme }),
}));
