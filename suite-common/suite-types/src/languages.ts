export type LocaleInfo = {
    name: string;
    en: string;
    type?: 'official' | 'community';
};

// If you are adding language, add it to suite/package.json translations:download script too
export const LANGUAGES = {
    'en-US': { name: 'English', en: 'English', type: 'official' },
    'es-ES': { name: 'Español', en: 'Spanish', type: 'official' },
    'cs-CZ': { name: 'Čeština', en: 'Czech', type: 'official' },
    'de-DE': { name: 'Deutsch', en: 'German', type: 'official' },
    'fr-FR': { name: 'Français', en: 'French', type: 'official' },
    'hu-HU': { name: 'Magyar', en: 'Hungarian', type: 'community' },
    'it-IT': { name: 'Italiano', en: 'Italian', type: 'community' },
    'ja-JP': { name: '日本語', en: 'Japanese', type: 'community' },
    'pt-BR': { name: 'Português (BR)', en: 'Portuguese (BR)', type: 'official' },
    'ru-RU': { name: 'Русский', en: 'Russian', type: 'community' },
    'tr-TR': { name: 'Türkçe', en: 'Turkish', type: 'community' },
    'uk-UA': { name: 'Українська', en: 'Ukrainian', type: 'community' },
    'zh-CN': { name: '中文(简体)', en: 'Chinese Simplified', type: 'community' },
    'zh-TW': { name: '中文(繁體)', en: 'Chinese Traditional', type: 'community' },
} as const satisfies Record<string, LocaleInfo>;

export type Locale = keyof typeof LANGUAGES;

export const NATIVE_LANGUAGES = {
    'en-US': LANGUAGES['en-US'],
    'cs-CZ': LANGUAGES['cs-CZ'],
};

export type NativeLocale = keyof typeof NATIVE_LANGUAGES;

export const isSupportedNativeLocale = (locale: string): locale is NativeLocale =>
    locale in NATIVE_LANGUAGES;
