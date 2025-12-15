import { useCallback, useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useDispatch } from 'react-redux';

import { getLocales } from 'expo-localization';

import { DEFAULT_LOCALE, type LocaleCode } from '../languages';
import { setSystemLocaleCode } from '../localeSlice';

export const useSystemLocaleListener = () => {
    const dispatch = useDispatch();

    const readSystemLocale = useCallback(() => {
        const systemLocale = (getLocales()[0].languageTag as LocaleCode) ?? DEFAULT_LOCALE;

        dispatch(setSystemLocaleCode(systemLocale));
    }, [dispatch]);

    useEffect(() => {
        // There is no event emitted when the language is changed in the system settings, so we need to check it on every return to the app.
        // Inspired by expo-localization docs: https://docs.expo.dev/versions/latest/sdk/localization/#behavior.
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                readSystemLocale();
            }
        });

        readSystemLocale();

        return () => subscription?.remove();
    }, [readSystemLocale]);
};
