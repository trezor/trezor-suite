import { useEffect, useState } from 'react';

import type { Locale } from 'date-fns';

import { useSelector } from 'src/hooks/suite';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';

export const useLocales = () => {
    const [locale, setLocale] = useState<Locale>();
    const language = useSelector(selectLanguage);

    useEffect(() => {
        let active = true;
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
            if (active) {
                setLocale(dateLocale);
            }
        };

        loadLocale();
        return () => {
            active = false;
        };
    }, [language]);

    return locale;
};
