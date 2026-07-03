import { LANGUAGES } from './languages';

export type { TxKeyPath } from './generated/translationKeys';

export type SupportedLocaleCode = keyof typeof LANGUAGES;

const isSupportedLanguage = (locale: string): locale is SupportedLocaleCode => locale in LANGUAGES;

export const isOfficiallySupportedLanguage = (locale: string): locale is SupportedLocaleCode =>
    isSupportedLanguage(locale) && LANGUAGES[locale].type === 'official';
