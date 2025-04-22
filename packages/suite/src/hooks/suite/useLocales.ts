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
            const lang = language === 'en' ? 'enUS' : language;

            let dateLocale;
            try {
                dateLocale = await import(/* @vite-ignore */ `date-fns/locale`).then(
                    module => module[lang as keyof typeof module],
                );
            } catch {
                dateLocale = await import(`date-fns/locale`).then(module => module['enUS']);

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
