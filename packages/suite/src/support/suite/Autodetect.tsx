import { useCallback, useEffect } from 'react';

import {
    selectAutodetectLanguage,
    selectAutodetectTheme,
    selectLanguage,
    selectTheme,
    suiteSettingsActions,
} from '@suite/settings';
import { type Locale } from '@suite-common/suite-types';
import { desktopApi } from '@trezor/suite-desktop-api';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { getOsTheme, watchOsTheme } from 'src/utils/suite/env';
import { getOsLocale, watchOsLocale } from 'src/utils/suite/l10n';

const Autodetect = () => {
    const autodetectTheme = useSelector(selectAutodetectTheme);
    const autodetectLanguage = useSelector(selectAutodetectLanguage);
    const currentTheme = useSelector(selectTheme);
    const currentLanguage = useSelector(selectLanguage);

    const dispatch = useDispatch();

    const setLanguage = useCallback(
        (language: Locale) => {
            dispatch(suiteSettingsActions.setLanguage(language));
        },
        [dispatch],
    );

    const setTheme = useCallback(
        (theme: 'dark' | 'light') => {
            dispatch(suiteSettingsActions.setTheme(theme));
        },
        [dispatch],
    );

    useEffect(() => {
        if (!autodetectTheme) return;
        const osTheme = getOsTheme();
        if (osTheme !== currentTheme) {
            dispatch(suiteSettingsActions.setTheme(osTheme));
        }
        const unwatch = watchOsTheme(setTheme);

        return () => unwatch();
    }, [autodetectTheme, currentTheme, dispatch, setTheme]);

    useEffect(() => {
        if (!autodetectTheme || !desktopApi.available) return;
        desktopApi.on('theme/system-change', setTheme);

        return () => desktopApi.removeAllListeners('theme/system-change');
    }, [autodetectTheme, setTheme]);

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
