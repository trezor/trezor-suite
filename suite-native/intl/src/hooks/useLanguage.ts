import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

import { DEFAULT_LANGUAGE } from '../constants';
import { selectLanguage } from '../localeSlice';
import { useSystemLanguage } from './useSystemLanguage';

export const useLanguage = () => {
    const isLocalizationEnabled = useFeatureFlag(FeatureFlag.IsLocalizationEnabled);
    const userSelectedLanguage = useSelector(selectLanguage);
    const systemLanguage = useSystemLanguage();

    const language = useMemo(() => {
        // If localization is disabled, always return default language
        if (!isLocalizationEnabled) {
            return DEFAULT_LANGUAGE;
        }

        return userSelectedLanguage === 'system' ? systemLanguage : userSelectedLanguage;
    }, [isLocalizationEnabled, userSelectedLanguage, systemLanguage]);

    return language;
};
