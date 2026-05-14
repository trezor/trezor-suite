import { useEffect, useState } from 'react';

import type { Locale as DateFnsLocale } from 'date-fns';

import { selectLanguage } from '@suite/settings';
import { type Locale as SuiteLocale } from '@suite-common/suite-types';

import { useSelector } from 'src/hooks/suite';

const getDateFnsLocale = (locale: SuiteLocale): DateFnsLocale['code'] => {
    const localeMap: Record<SuiteLocale, DateFnsLocale['code']> = {
        'en-US': 'enUS',
        'es-ES': 'es',
        'cs-CZ': 'cs',
        'de-DE': 'de',
        'fr-FR': 'fr',
        'hu-HU': 'hu',
        'id-ID': 'id',
        'it-IT': 'it',
        'ja-JP': 'ja',
        'ko-KR': 'ko',
        'pt-BR': 'ptBR',
        'ru-RU': 'ru',
        'tr-TR': 'tr',
        'uk-UA': 'uk',
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
