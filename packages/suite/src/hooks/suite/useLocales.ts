import type { Locale as DateFnsLocale } from 'date-fns';

import { selectLanguage } from '@suite/settings';
import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { type Locale as SuiteLocale } from '@suite-common/suite-types';

import { useSelector } from 'src/hooks/suite';

type DateFnsLocaleLoader = () => Promise<DateFnsLocale>;

// Every entry has to be a literal import() of a single date-fns/locale/* subpath. Importing the
// date-fns/locale barrel instead - or indexing it with a runtime value - leaves webpack unable to
// tell which export is used, so it keeps all 96 locales (~2 MB) instead of the 16 we support.
const DATE_FNS_LOCALE_LOADERS: Record<SuiteLocale, DateFnsLocaleLoader> = {
    'en-US': () => import('date-fns/locale/en-US').then(({ enUS }) => enUS),
    'es-ES': () => import('date-fns/locale/es').then(({ es }) => es),
    'cs-CZ': () => import('date-fns/locale/cs').then(({ cs }) => cs),
    'de-DE': () => import('date-fns/locale/de').then(({ de }) => de),
    'fr-FR': () => import('date-fns/locale/fr').then(({ fr }) => fr),
    'hu-HU': () => import('date-fns/locale/hu').then(({ hu }) => hu),
    'id-ID': () => import('date-fns/locale/id').then(({ id }) => id),
    'it-IT': () => import('date-fns/locale/it').then(({ it }) => it),
    'ja-JP': () => import('date-fns/locale/ja').then(({ ja }) => ja),
    'ko-KR': () => import('date-fns/locale/ko').then(({ ko }) => ko),
    'pt-BR': () => import('date-fns/locale/pt-BR').then(({ ptBR }) => ptBR),
    'ru-RU': () => import('date-fns/locale/ru').then(({ ru }) => ru),
    'tr-TR': () => import('date-fns/locale/tr').then(({ tr }) => tr),
    'uk-UA': () => import('date-fns/locale/uk').then(({ uk }) => uk),
    'zh-CN': () => import('date-fns/locale/zh-CN').then(({ zhCN }) => zhCN),
    'zh-TW': () => import('date-fns/locale/zh-TW').then(({ zhTW }) => zhTW),
};

/**
 * Loads the date-fns locale matching a Suite language, falling back to English when its chunk
 * cannot be fetched.
 */
export const loadDateFnsLocale = async (language: SuiteLocale): Promise<DateFnsLocale> => {
    try {
        return await DATE_FNS_LOCALE_LOADERS[language]();
    } catch {
        // A locale chunk can fail to load when the user is offline or when a deploy invalidated
        // it, so fall back to English instead of leaving dates unformatted.
        console.warn(`date-fns locale ${language} could not be loaded. Using en-US.`);

        return DATE_FNS_LOCALE_LOADERS['en-US']();
    }
};

export const useLocales = () => {
    const language = useSelector(selectLanguage);

    // A locale module never changes once its chunk is loaded, so it is cached forever rather than
    // refetched on focus/reconnect the way the provider defaults would.
    const { data: locale } = useQuery({
        queryKey: desktopQueryKeys.dateFnsLocale(language),
        queryFn: () => loadDateFnsLocale(language),
        staleTime: Infinity,
        gcTime: Infinity,
    });

    return locale;
};
