import type { Locale as DateFnsLocale } from 'date-fns';

import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { type Locale as SuiteLocale } from '@suite-common/suite-types';

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
 * Loads the date-fns locale matching a Suite language. A chunk that cannot be fetched rejects, so
 * the query retries and refetches on reconnect; until it arrives the hook returns undefined and
 * date-fns formats with its built-in English.
 */
export const loadDateFnsLocale = (locale: SuiteLocale): Promise<DateFnsLocale> =>
    DATE_FNS_LOCALE_LOADERS[locale]();

export const useDateFnsLocale = (locale: SuiteLocale) => {
    // A locale module never changes once its chunk is loaded, so it is cached forever rather than
    // refetched on focus/reconnect the way the provider defaults would.
    const { data: dateFnsLocale } = useQuery({
        queryKey: desktopQueryKeys.dateFnsLocale(locale),
        queryFn: () => loadDateFnsLocale(locale),
        staleTime: Infinity,
        gcTime: Infinity,
    });

    return dateFnsLocale;
};
