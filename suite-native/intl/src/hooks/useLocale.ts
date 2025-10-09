import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

import { DEFAULT_LOCALE } from '../constants';
import { selectUserSelectedLocale } from '../localeSlice';
import { useSystemLocale } from './useSystemLocale';

export const useLocale = () => {
    const isLocalizationEnabled = useFeatureFlag(FeatureFlag.IsLocalizationEnabled);
    const userSelectedLocale = useSelector(selectUserSelectedLocale);
    const systemLocale = useSystemLocale();

    const locale = useMemo(() => {
        // If localization is disabled, always return default locale
        if (!isLocalizationEnabled) {
            return DEFAULT_LOCALE;
        }

        return userSelectedLocale === 'system' ? systemLocale : userSelectedLocale;
    }, [isLocalizationEnabled, userSelectedLocale, systemLocale]);

    return locale;
};
