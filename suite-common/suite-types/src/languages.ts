const languages = {
    'en-US': { name: 'English', en: 'English', type: 'official' },
    'es-ES': { name: 'Español', en: 'Spanish', type: 'official' },
    'ar-SA': { name: 'العربية‬', en: 'Arabic' },
    'ca-ES': { name: 'Català', en: 'Catalan' },
    'cs-CZ': { name: 'Čeština', en: 'Czech', type: 'official' },
    'da-DK': { name: 'Dansk', en: 'Danish' },
    'de-DE': { name: 'Deutsch', en: 'German', type: 'official' },
    'el-GR': { name: 'Ελληνικά', en: 'Greek' },
    'fi-FI': { name: 'Suomi', en: 'Finnish' },
    'fr-FR': { name: 'Français', en: 'French', type: 'official' },
    'he-IL': { name: 'עברית‬', en: 'Hebrew' },
    'hi-IN': { name: 'हिन्दी', en: 'Hindi' },
    'hu-HU': { name: 'Magyar', en: 'Hungarian', type: 'community' },
    'id-ID': { name: 'Bahasa Indonesia', en: 'Indonesian' },
    'it-IT': { name: 'Italiano', en: 'Italian', type: 'community' },
    'ja-JP': { name: '日本語', en: 'Japanese', type: 'community' },
    'jv-ID': { name: 'Basa Jawa', en: 'Javanese' },
    'ko-KR': { name: '한국어', en: 'Korean' },
    'nl-NL': { name: 'Nederlands', en: 'Dutch' },
    'no-NO': { name: 'Norsk', en: 'Norwegian' },
    'pl-PL': { name: 'Polski', en: 'Polish' },
    'pt-BR': { name: 'Português (BR)', en: 'Portuguese (BR)', type: 'official' },
    'ro-RO': { name: 'Română', en: 'Romanian' },
    'ru-RU': { name: 'Русский', en: 'Russian', type: 'community' },
    'sr-RS': { name: 'Српски', en: 'Serbian' },
    'sv-SE': { name: 'Svenska', en: 'Swedish' },
    'tr-TR': { name: 'Türkçe', en: 'Turkish', type: 'community' },
    'uk-UA': { name: 'Українська', en: 'Ukrainian', type: 'community' },
    'vi-VN': { name: 'Tiếng Việt', en: 'Vietnamese' },
    'zh-CN': { name: '中文(简体)', en: 'Chinese Simplified', type: 'community' },
    'zh-TW': { name: '中文(繁體)', en: 'Chinese Traditional', type: 'community' },
} as const;

export type Locale = keyof typeof languages;

export type LocaleInfo = {
    name: string;
    en: string;
    type?: 'official' | 'community';
};

export const LANGUAGES = languages as { [code in Locale]: LocaleInfo };
