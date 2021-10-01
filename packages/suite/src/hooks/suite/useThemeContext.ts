import { useState, useEffect } from 'react';
import { useSelector } from '@suite-hooks';
import { getOsTheme } from '@suite-utils/env';
import { getThemeColors } from '@suite-utils/theme';
import { loadSuiteSettings } from '@suite-actions/storageActions';
import type { SuiteState } from '@suite-reducers/suiteReducer';

export const useThemeContext = () => {
    const [preloadedTheme, setPreloadedTheme] = useState<SuiteState['settings']['theme']>();
    const { theme, storageLoaded } = useSelector(state => ({
        theme: state.suite.settings.theme,
        storageLoaded: state.suite.storageLoaded,
    }));

    useEffect(() => {
        if (storageLoaded || preloadedTheme) return;
        loadSuiteSettings()
            .then(suiteSettings => setPreloadedTheme(suiteSettings?.settings.theme))
            .catch(err => console.log(err));
    }, [storageLoaded, preloadedTheme]);

    const resolvedTheme = storageLoaded
        ? theme
        : preloadedTheme || {
              variant: getOsTheme(),
          };

    return getThemeColors(resolvedTheme);
};
