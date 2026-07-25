import { messages as defaultMessages } from './messages';
import { type SupportedLocaleCode } from './types';
import { flatten } from './utils';

const LANGUAGE_TRANSLATIONS_MAP = {
    'en-US': require('../translations/en-US.json'),
    'cs-CZ': require('../translations/cs-CZ.json'),
    'de-DE': require('../translations/de-DE.json'),
    'es-ES': require('../translations/es-ES.json'),
    'fr-FR': require('../translations/fr-FR.json'),
    'pt-BR': require('../translations/pt-BR.json'),
    'ja-JP': require('../translations/ja-JP.json'),
    'zh-CN': require('../translations/zh-CN.json'),
} as const satisfies Record<SupportedLocaleCode, any>;

// Default values defined during the development.
const englishFallback = flatten(defaultMessages);

export const getMessagesForLocale = (locale: SupportedLocaleCode): Record<string, string> => ({
    ...englishFallback,
    ...LANGUAGE_TRANSLATIONS_MAP[locale],
});
