import { useEffect } from 'react';
import { getOsTheme, watchOsTheme } from '@suite-utils/env';
import { getOsLocale, watchOsLocale } from '@suite-utils/l10n';
import { useActions, useSelector } from '@suite-hooks';
import { setTheme as setThemeAction } from '@suite-actions/suiteActions';
import * as languageActions from '@settings-actions/languageActions';

const Autodetect = () => {
    const { autodetectTheme, autodetectLanguage, currentTheme, currentLanguage, storageLoaded } =
        useSelector(state => ({
            autodetectTheme: state.suite.settings.autodetect.theme,
            autodetectLanguage: state.suite.settings.autodetect.language,
            currentTheme: state.suite.settings.theme.variant,
            currentLanguage: state.suite.settings.language,
            storageLoaded: state.suite.storageLoaded,
        }));
    const { setTheme, fetchLocale } = useActions({
        setTheme: setThemeAction,
        fetchLocale: languageActions.fetchLocale,
    });

    useEffect(() => {
        if (!storageLoaded || !autodetectTheme) return;
        const osTheme = getOsTheme();
        if (osTheme !== currentTheme) {
            setTheme(osTheme);
        }
        const unwatch = watchOsTheme(setTheme);
        return () => unwatch();
    }, [storageLoaded, autodetectTheme, currentTheme, setTheme]);

    useEffect(() => {
        if (!storageLoaded || !autodetectLanguage) return;
        const osLocale = getOsLocale(currentLanguage);
        if (osLocale !== currentLanguage) {
            fetchLocale(osLocale);
        }
        const unwatch = watchOsLocale(fetchLocale);
        return () => unwatch();
    }, [storageLoaded, autodetectLanguage, currentLanguage, fetchLocale]);

    return null;
};

export default Autodetect;
