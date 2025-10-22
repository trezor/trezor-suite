import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

import { DEFAULT_LOCALE } from '../constants';
import { selectUserSelectedLocaleTag } from '../localeSlice';
import { useSystemLocaleTag } from './useSystemLocaleTag';

export const useLocale = () => {
    const isLocalizationEnabled = useFeatureFlag(FeatureFlag.IsLocalizationEnabled);
    const userSelectedLocaleTag = useSelector(selectUserSelectedLocaleTag);
    const systemLocaleTag = useSystemLocaleTag();

    const locale = useMemo(() => {
        // If localization is disabled, always return default locale
        if (!isLocalizationEnabled) {
            return DEFAULT_LOCALE;
        }

        return userSelectedLocaleTag === 'system' ? systemLocaleTag : userSelectedLocaleTag;
    }, [isLocalizationEnabled, userSelectedLocaleTag, systemLocaleTag]);

    return locale;
};
