import { useEffect } from 'react';
import { getOsTheme, watchOsTheme } from 'src/utils/suite/env';
import { getOsLocale, watchOsLocale } from 'src/utils/suite/l10n';
import { useActions, useSelector } from 'src/hooks/suite';
import { setTheme as setThemeAction } from 'src/actions/suite/suiteActions';
import * as languageActions from 'src/actions/settings/languageActions';

const Autodetect = () => {
    const autodetectTheme = useSelector(state => state.suite.settings.autodetect.theme);
    const autodetectLanguage = useSelector(state => state.suite.settings.autodetect.language);
    const currentTheme = useSelector(state => state.suite.settings.theme.variant);
    const currentLanguage = useSelector(state => state.suite.settings.language);

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
