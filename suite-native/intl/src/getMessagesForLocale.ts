import { DEFAULT_LOCALE } from './languages';
import { messages as defaultMessages } from './messages';
import { type SupportedLocaleCode } from './types';
import { flatten } from './utils';

type TranslatedMessages = Record<string, string>;

// Wrapped in functions so Metro loads a catalog on first use, not at module evaluation.
// English is fully covered by `messages.ts`.
const TRANSLATION_CATALOG_LOADERS = {
    'cs-CZ': () => require('../translations/cs-CZ.json'),
    'de-DE': () => require('../translations/de-DE.json'),
    'es-ES': () => require('../translations/es-ES.json'),
    'fr-FR': () => require('../translations/fr-FR.json'),
    'id-ID': () => require('../translations/id-ID.json'),
    'pt-BR': () => require('../translations/pt-BR.json'),
    'ja-JP': () => require('../translations/ja-JP.json'),
    'zh-CN': () => require('../translations/zh-CN.json'),
} as const satisfies Record<
    Exclude<SupportedLocaleCode, typeof DEFAULT_LOCALE>,
    () => TranslatedMessages
>;

const messagesCache = new Map<SupportedLocaleCode, TranslatedMessages>();

export const getMessagesForLocale = (locale: SupportedLocaleCode): TranslatedMessages => {
    const cachedMessages = messagesCache.get(locale);

    if (cachedMessages) {
        return cachedMessages;
    }

    const messages =
        locale === DEFAULT_LOCALE
            ? flatten(defaultMessages)
            : { ...getMessagesForLocale(DEFAULT_LOCALE), ...TRANSLATION_CATALOG_LOADERS[locale]() };

    messagesCache.set(locale, messages);

    return messages;
};
