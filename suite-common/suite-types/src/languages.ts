export type LocaleInfo = {
    icon: string;
    name: string;
    en: string;
    type: 'official' | 'community';
    nameInOsStartsWith?: string;
};

// If you are adding language, add it to suite/package.json translations:download script too
export const LANGUAGES = {
    'en-US': { icon: '🇬🇧', name: 'English', en: 'English', type: 'official' },
    'es-ES': { icon: '🇪🇸', name: 'Español', en: 'Spanish', type: 'official' },
    'cs-CZ': { icon: '🇨🇿', name: 'Čeština', en: 'Czech', type: 'official' },
    'de-DE': { icon: '🇩🇪', name: 'Deutsch', en: 'German', type: 'official' },
    'fr-FR': { icon: '🇫🇷', name: 'Français', en: 'French', type: 'official' },
    'hu-HU': { icon: '🇭🇺', name: 'Magyar', en: 'Hungarian', type: 'community' },
    'id-ID': { icon: '🇮🇩', name: 'Bahasa Indonesia', en: 'Indonesian', type: 'community' },
    'it-IT': { icon: '🇮🇹', name: 'Italiano', en: 'Italian', type: 'community' },
    'ja-JP': { icon: '🇯🇵', name: '日本語', en: 'Japanese', type: 'official' },
    'ko-KR': { icon: '🇰🇷', name: '한국어', en: 'Korean', type: 'official' },
    'pt-BR': { icon: '🇧🇷', name: 'Português (BR)', en: 'Portuguese (BR)', type: 'official' },
    'ru-RU': { icon: '🇷🇺', name: 'Русский', en: 'Russian', type: 'community' },
    'tr-TR': { icon: '🇹🇷', name: 'Türkçe', en: 'Turkish', type: 'community' },
    'uk-UA': { icon: '🇺🇦', name: 'Українська', en: 'Ukrainian', type: 'community' },
    'zh-CN': {
        icon: '简',
        name: '中文(简体)',
        en: 'Chinese Simplified',
        type: 'community',
        nameInOsStartsWith: 'zh-Hans',
    },
    'zh-TW': {
        icon: '繁',
        name: '中文(繁體)',
        en: 'Chinese Traditional',
        type: 'community',
        nameInOsStartsWith: 'zh-Hant',
    },
} as const satisfies Record<string, LocaleInfo>;

export type Locale = keyof typeof LANGUAGES;
