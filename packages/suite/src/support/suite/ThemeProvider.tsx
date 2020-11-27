import React, { useEffect, useState } from 'react';
import { ThemeProvider as SCThemeProvider } from 'styled-components';
import { THEME } from '@trezor/components';
import * as suiteActions from '@suite-actions/suiteActions';
import { useSelector, useActions } from '@suite-hooks';
import { getOSTheme } from '@suite-utils/dom';
import { db } from '@suite/storage';
import { AppState } from '@suite-types';

const getThemeColors = (theme: AppState['suite']['settings']['theme']) => {
    switch (theme?.variant) {
        case 'light':
            return THEME.light;
        case 'dark':
            return THEME.dark;
        case 'custom':
            // custom theme is a secret feature accessible in debug settings
            return {
                ...THEME.dark, // spread default colors, so we can be sure no new colors are missing in user's palette
                ...theme.colors, // custom saved colors
            };
        default:
            return THEME.light;
    }
};

const ThemeProvider: React.FC = ({ children }) => {
    const theme = useSelector(state => state.suite.settings.theme);
    const [storedTheme, setStoredTheme] = useState<
        AppState['suite']['settings']['theme'] | null | undefined
    >(); // null represents no theme is stored in db, while undefined means reading from db was not completed yet
    const [error, setError] = useState(false);

    const { setTheme } = useActions({
        setTheme: suiteActions.setTheme,
    });

    useEffect(() => {
        // effect for automatically choosing theme based on OS settings
        const loadStoredTheme = async () => {
            // load saved theme from db (we don't want to way for SUITE.STORAGE_LOADED, as it is fired way later)
            try {
                const suiteSettings = await db.getItemByPK('suiteSettings', 'suite');
                const savedTheme = suiteSettings?.settings.theme;
                setStoredTheme(savedTheme ?? null);
            } catch {
                setStoredTheme(null);
                setError(true);
            }
        };

        if (!storedTheme) {
            loadStoredTheme();
        }

        // set active theme OS based theme only if there are no saved settings
        if (storedTheme === null && !error) {
            const osTheme = getOSTheme();
            if (osTheme !== theme.variant) {
                setTheme(osTheme);
            }
        }
    }, [theme, setTheme, storedTheme, setStoredTheme, error]);

    return <SCThemeProvider theme={getThemeColors(theme)}>{children}</SCThemeProvider>;
};

export default ThemeProvider;
