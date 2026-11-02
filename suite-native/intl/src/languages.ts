import { type LocaleInfo, LANGUAGES as SUITE_LANGUAGES } from '@suite-common/locale';

export const DEFAULT_LOCALE = 'en-US';
export type LocaleCode = `${string}-${string}`;

type NativeLocaleCode =
    'id-ID' | 'cs-CZ' | 'de-DE' | 'en-US' | 'es-ES' | 'fr-FR' | 'pt-BR' | 'ja-JP' | 'zh-CN';

// Suite Native supports a subset of Suite languages; their details come from the shared list.
export const LANGUAGES: Record<NativeLocaleCode, LocaleInfo> = {
    'id-ID': SUITE_LANGUAGES['id-ID'],
    'cs-CZ': SUITE_LANGUAGES['cs-CZ'],
    'de-DE': SUITE_LANGUAGES['de-DE'],
    'en-US': SUITE_LANGUAGES['en-US'],
    'es-ES': SUITE_LANGUAGES['es-ES'],
    'fr-FR': SUITE_LANGUAGES['fr-FR'],
    'pt-BR': SUITE_LANGUAGES['pt-BR'],
    'ja-JP': SUITE_LANGUAGES['ja-JP'],
    'zh-CN': SUITE_LANGUAGES['zh-CN'],
};
