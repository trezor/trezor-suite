import { useEffect, useState } from 'react';

import type { Locale as DateFnsLocale } from 'date-fns';

import { Locale as SuiteLocale } from '@suite-common/suite-types';

import { useSelector } from 'src/hooks/suite';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';

const getDateFnsLocale = (locale: SuiteLocale): DateFnsLocale['code'] => {
    const localeMap: Record<SuiteLocale, DateFnsLocale['code']> = {
        'en-US': 'enUS',
        'es-ES': 'es',
        'af-ZA': 'af',
        'ar-SA': 'ar-SA',
        'ca-ES': 'ca',
        'cs-CZ': 'cs',
        'da-DK': 'da',
        'de-DE': 'de',
        'el-GR': 'el',
        'fi-FI': 'fi',
        'fr-FR': 'fr',
        'he-IL': 'he',
        'hi-IN': 'hi',
        'hu-HU': 'hu',
        'id-ID': 'id',
        'it-IT': 'it',
        'ja-JP': 'ja',
        'jv-ID': 'id', // Javanese not available, fallback to Indonesian
        'ko-KR': 'ko',
        'nl-NL': 'nl',
        'no-NO': 'nb',
        'pl-PL': 'pl',
        'pt-BR': 'ptBR',
        'ro-RO': 'ro',
        'ru-RU': 'ru',
        'sk-SK': 'sk',
        'sr-RS': 'sr',
        'sv-SE': 'sv',
        'tr-TR': 'tr',
        'uk-UA': 'uk',
        'vi-VN': 'vi',
        'zh-CN': 'zhCN',
        'zh-TW': 'zhTW',
    };

    return localeMap[locale];
};

export const useLocales = () => {
    const [locale, setLocale] = useState<DateFnsLocale>();
    const language = useSelector(selectLanguage);

    useEffect(() => {
        let active = true;
        const loadLocale = async () => {
            const lang = getDateFnsLocale(language);

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
                setLocale(dateLocale as DateFnsLocale);
            }
        };

        loadLocale();

        return () => {
            active = false;
        };
    }, [language]);

    return locale;
};
