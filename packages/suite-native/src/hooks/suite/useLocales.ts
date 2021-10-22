/* eslint-disable global-require */
import { useMemo } from 'react';

import type { Locale } from 'date-fns';

import { useSelector } from '@suite-hooks';

export const useLocales = () => {
    const { language } = useSelector(state => ({
        language: state.suite.settings.language,
    }));

    const locale = useMemo(() => {
        const lang = language === 'en' ? 'en-US' : language;
        const locales: { [key: string]: Locale } = {
            'en-US': require('date-fns/locale/en-US/index'),
            // cs: require('date-fns/locale/cs/index'),
            // es: require('date-fns/locale/es/index'),
            // de: require('date-fns/locale/de/index'),
            // fr: require('date-fns/locale/fr/index'),
            // ru: require('@date-fns/locale/ru/index'),
        };

        let dateLocale = locales[lang];

        if (!dateLocale) {
            dateLocale = locales['en-US'];

            console.warn(`date-fns language: ${language} is not available. Using en-US fallback.`);
        }

        return dateLocale;
    }, [language]);

    return locale;
};
