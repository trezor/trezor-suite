import { LANGUAGES } from './languages';
import { type messages } from './messages';

export type Translations = typeof messages;

/**
 * Builds up valid keypaths for translations.
 */
export type TxKeyPath = RecursiveKeyOf<Translations>;

// via: https://stackoverflow.com/a/65333050
type RecursiveKeyOf<TObj extends object> = {
    [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<TObj[TKey], `${TKey}`>;
}[keyof TObj & (string | number)];

type RecursiveKeyOfInner<TObj extends object> = {
    [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<TObj[TKey], `.${TKey}`>;
}[keyof TObj & (string | number)];

type RecursiveKeyOfHandleValue<TValue, Text extends string> = TValue extends any[]
    ? Text
    : TValue extends object
      ? Text | `${Text}${RecursiveKeyOfInner<TValue>}`
      : Text;

export type SupportedLocaleCode = keyof typeof LANGUAGES;

export const isSupportedLanguage = (locale: string): locale is SupportedLocaleCode =>
    locale in LANGUAGES;

export const isOfficiallySupportedLanguage = (locale: string): locale is SupportedLocaleCode =>
    isSupportedLanguage(locale) && LANGUAGES[locale].type === 'official';
