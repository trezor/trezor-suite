import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { getLocales } from 'expo-localization';

const readSystemLocale = () => {
    const locale = getLocales();

    return locale[0].languageTag;
};

export const useSystemLocaleTag = () => {
    const [systemLanguage, setSystemLanguage] = useState(readSystemLocale());

    useEffect(() => {
        // There is no event emitted when the language is changed in the system settings, so we need to check it on every return to the app.
        // Inspired by expo-localization docs: https://docs.expo.dev/versions/latest/sdk/localization/#behavior.
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                setSystemLanguage(readSystemLocale());
            }
        });

        return () => subscription?.remove();
    }, []);

    return systemLanguage;
};
