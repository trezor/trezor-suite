import { useEffect } from 'react';
import { getOsTheme, watchOsTheme } from '@suite-utils/env';
import { getOsLocale, watchOsLocale } from '@suite-utils/l10n';
import { useActions, useSelector } from '@suite-hooks';
import { setTheme as setThemeAction } from '@suite-actions/suiteActions';
import * as languageActions from '@settings-actions/languageActions';

const Autodetect = () => {
    const { autodetectTheme, autodetectLanguage, currentTheme, currentLanguage } = useSelector(
        state => ({
            autodetectTheme: state.suite.settings.autodetect.theme,
            autodetectLanguage: state.suite.settings.autodetect.language,
            currentTheme: state.suite.settings.theme.variant,
            currentLanguage: state.suite.settings.language,
        }),
    );
    const { setTheme, setLanguage } = useActions({
        setTheme: setThemeAction,
        setLanguage: languageActions.setLanguage,
    });

    useEffect(() => {
        if (!autodetectTheme) return;
        const osTheme = getOsTheme();
        if (osTheme !== currentTheme) {
            setTheme(osTheme);
        }
        const unwatch = watchOsTheme(setTheme);
        return () => unwatch();
    }, [autodetectTheme, currentTheme, setTheme]);

    useEffect(() => {
        if (!autodetectLanguage) return;
        const osLocale = getOsLocale(currentLanguage);
        if (osLocale !== currentLanguage) {
            setLanguage(osLocale);
        }
        const unwatch = watchOsLocale(setLanguage);
        return () => unwatch();
    }, [autodetectLanguage, currentLanguage, setLanguage]);

    return null;
};

export default Autodetect;
