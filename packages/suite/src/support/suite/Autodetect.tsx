import { useCallback, useEffect } from 'react';

import { type Locale } from '@suite-common/suite-types';

import * as languageActions from 'src/actions/settings/languageActions';
import { setTheme as setThemeAction } from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getOsTheme, watchOsTheme } from 'src/utils/suite/env';
import { getOsLocale, watchOsLocale } from 'src/utils/suite/l10n';

const Autodetect = () => {
    const autodetectTheme = useSelector(state => state.suite.settings.autodetect.theme);
    const autodetectLanguage = useSelector(state => state.suite.settings.autodetect.language);
    const currentTheme = useSelector(state => state.suite.settings.theme.variant);
    const currentLanguage = useSelector(state => state.suite.settings.language);

    const dispatch = useDispatch();

    const setLanguage = useCallback(
        (language: Locale) => {
            dispatch(languageActions.setLanguage(language));
        },
        [dispatch],
    );

    useEffect(() => {
        if (!autodetectTheme) return;
        const osTheme = getOsTheme();
        if (osTheme !== currentTheme) {
            dispatch(setThemeAction(osTheme));
        }
        const unwatch = watchOsTheme(setThemeAction);

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
