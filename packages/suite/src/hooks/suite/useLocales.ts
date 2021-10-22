import { useEffect, useState } from 'react';

import type { Locale } from 'date-fns';

import { useSelector } from '@suite-hooks';

export const useLocales = () => {
    const [locale, setLocale] = useState<Locale>();
    const { language } = useSelector(state => ({
        language: state.suite.settings.language,
    }));

    useEffect(() => {
        const loadLocale = async () => {
            const lang = language === 'en' ? 'en-US' : language;

            let dateLocale;
            try {
                dateLocale = await import(`date-fns/locale/${lang}/index`);
            } catch (error) {
                dateLocale = await import(`date-fns/locale/en-US/index`);

                console.warn(
                    `date-fns language: ${language} is not available. Using en-US fallback.`,
                );
            }
            setLocale(dateLocale);
        };

        loadLocale();
    }, [language]);

    return locale;
};
