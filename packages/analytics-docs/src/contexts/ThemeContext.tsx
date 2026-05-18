import {
    type ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { throwError } from '@trezor/utils';

const STORAGE_KEY = 'analytics-docs-theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const getSystemTheme = (): ResolvedTheme =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

const getStoredPreference = (): ThemePreference => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;

    return 'system';
};

type ThemeContextValue = {
    preference: ThemePreference;
    resolvedTheme: ResolvedTheme;
    setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = () =>
    useContext(ThemeContext) ?? throwError('useTheme must be used within ThemeProvider');

export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
    const [preference, setPreferenceState] = useState<ThemePreference>(getStoredPreference);
    const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

    const resolvedTheme: ResolvedTheme = useMemo(
        () => (preference === 'system' ? systemTheme : preference),
        [preference, systemTheme],
    );

    const setPreference = useCallback((next: ThemePreference) => {
        setPreferenceState(next);
        localStorage.setItem(STORAGE_KEY, next);
    }, []);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => setSystemTheme(getSystemTheme());
        mq.addEventListener('change', listener);

        return () => mq.removeEventListener('change', listener);
    }, []);

    const value = useMemo(
        () => ({ preference, resolvedTheme, setPreference }),
        [preference, resolvedTheme, setPreference],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
