import { useCallback, useEffect } from 'react';

import { suiteSettingsActions } from '@suite/settings';
import { type Locale } from '@suite-common/suite-types';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { getOsTheme, watchOsTheme } from 'src/utils/suite/env';
import { getOsLocale, watchOsLocale } from 'src/utils/suite/l10n';

const Autodetect = () => {
    const autodetectTheme = useSelector(state => state.suiteSettings.autodetect.theme);
    const autodetectLanguage = useSelector(state => state.suiteSettings.autodetect.language);
    const currentTheme = useSelector(state => state.suiteSettings.theme.variant);
    const currentLanguage = useSelector(state => state.suiteSettings.language);

    const dispatch = useDispatch();

    const setLanguage = useCallback(
        (language: Locale) => {
            dispatch(suiteSettingsActions.setLanguage(language));
        },
        [dispatch],
    );

    useEffect(() => {
        if (!autodetectTheme) return;
        const osTheme = getOsTheme();
        if (osTheme !== currentTheme) {
            dispatch(suiteSettingsActions.setTheme(osTheme));
        }
        const unwatch = watchOsTheme(suiteSettingsActions.setTheme);

        return () => unwatch();
    }, [autodetectTheme, currentTheme, dispatch]);

    useEffect(() => {
        if (!autodetectLanguage) return;
        const osLocale = getOsLocale(currentLanguage);
        if (osLocale !== currentLanguage) {
            setLanguage(osLocale);
        }
        const unwatch = watchOsLocale(setLanguage);

        return () => unwatch();
    }, [autodetectLanguage, currentLanguage, dispatch, setLanguage]);

    return null;
};

export default Autodetect;
