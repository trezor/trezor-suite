import { useEffect, useState } from 'react';

export const useTheme = () => {
    const getCurrentTheme = () =>
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const [theme, setTheme] = useState<'dark' | 'light'>(getCurrentTheme());

    const mqListener = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'dark' : 'light');
    };

    useEffect(() => {
        const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
        darkThemeMq.addEventListener('change', mqListener);

        return () => darkThemeMq.removeEventListener('change', mqListener);
    }, []);

    return theme;
};
