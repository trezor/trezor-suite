import { desktopQueryKeys, keepPreviousData, useQuery } from '@suite-common/react-query';
import type { Locale } from '@suite-common/suite-types';

import enMessages from '../../translations/en-US.json';

export type IntlMessages = Record<string, string>;

// The English catalog is part of the bundle, while every other locale is a lazy chunk.
const BUNDLED_LOCALE: Locale = 'en-US';

/**
 * Loads the translation chunk of a locale and merges it over the bundled English catalog, so
 * strings that are not translated yet fall back to English. A chunk that cannot be fetched
 * yields the English catalog.
 */
export const loadIntlMessages = async (locale: Locale): Promise<IntlMessages> => {
    if (locale === BUNDLED_LOCALE) {
        return enMessages;
    }

    const localizedMessages: IntlMessages = await import(
        /* webpackChunkName: "translations/[request]" */ `../../translations/${locale}.json`
    )
        .then(res => res.default)
        .catch(() => ({}));

    return { ...enMessages, ...localizedMessages };
};

/**
 * Returns the react-intl catalog of the locale: the bundled English one synchronously, any other
 * one once its chunk has loaded, with the previous catalog (English at first) shown until then.
 */
export const useIntlMessages = (locale: Locale): IntlMessages => {
    const { data: messages } = useQuery({
        queryKey: desktopQueryKeys.intlMessages(locale),
        queryFn: () => loadIntlMessages(locale),
        // The English query starts resolved with the bundled catalog, so it never fetches and
        // the first render of the default locale is not followed by a second one.
        initialData: locale === BUNDLED_LOCALE ? enMessages : undefined,
        // A catalog never changes once its chunk is loaded, so it is cached forever rather than
        // refetched on focus/reconnect the way the provider defaults would.
        staleTime: Infinity,
        gcTime: Infinity,
        // Keep the current catalog on screen while the next locale's chunk loads.
        placeholderData: keepPreviousData,
    });

    return messages ?? enMessages;
};
