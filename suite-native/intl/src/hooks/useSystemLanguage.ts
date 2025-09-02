import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { getLocales } from 'expo-localization';

import { NativeLocale, isSupportedNativeLocale } from '@suite-common/suite-types';

import { DEFAULT_LANGUAGE } from '../constants';

const readSystemLanguage = () => {
    const currentSystemLanguage = getLocales()[0].languageTag;

    if (isSupportedNativeLocale(currentSystemLanguage)) {
        return currentSystemLanguage;
    }

    return DEFAULT_LANGUAGE;
};

export const useSystemLanguage = () => {
    const [systemLanguage, setSystemLanguage] = useState<NativeLocale>(readSystemLanguage());

    useEffect(() => {
        // There is no event emitted when the language is changed in the system settings, so we need to check it on every return to the app.
        // Inspired by expo-localization docs: https://docs.expo.dev/versions/latest/sdk/localization/#behavior.
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                setSystemLanguage(readSystemLanguage());
            }
        });

        return () => subscription.remove();
    }, []);

    return systemLanguage;
};
