export const TRANSLATION_PSEUDOLANGUAGE = 'lol' as const;

const LANGUAGES = {
    en: { name: 'English', en: 'English', complete: true },
    es: { name: 'Español', en: 'Spanish', complete: true },
    af: { name: 'Afrikaans', en: 'Afrikaans' },
    ar: { name: 'العربية‬', en: 'Arabic' },
    ca: { name: 'Català', en: 'Catalan' },
    cs: { name: 'Čeština', en: 'Czech', complete: true },
    da: { name: 'Dansk', en: 'Danish' },
    de: { name: 'Deutsch', en: 'German' },
    el: { name: 'Ελληνικά', en: 'Greek' },
    fi: { name: 'Suomi', en: 'Finnish' },
    fr: { name: 'Français', en: 'French' },
    he: { name: 'עברית‬', en: 'Hebrew' },
    hi: { name: 'हिन्दी', en: 'Hindi' },
    hu: { name: 'Magyar', en: 'Hungarian' },
    id: { name: 'Bahasa Indonesia', en: 'Indonesian' },
    it: { name: 'Italiano', en: 'Italian' },
    ja: { name: '日本語（ベータ版）', en: 'Japanese (BETA)', complete: true },
    jv: { name: 'Basa Jawa', en: 'Javanese' },
    ko: { name: '한국어', en: 'Korean' },
    nl: { name: 'Nederlands', en: 'Dutch' },
    no: { name: 'Norsk', en: 'Norwegian' },
    pl: { name: 'Polski', en: 'Polish' },
    pt: { name: 'Português', en: 'Portuguese' },
    ro: { name: 'Română', en: 'Romanian' },
    ru: { name: 'Русский', en: 'Russian', complete: true },
    sk: { name: 'Slovenčina', en: 'Slovak' },
    sr: { name: 'Српски', en: 'Serbian' },
    sv: { name: 'Svenska', en: 'Swedish' },
    tr: { name: 'Türkçe', en: 'Turkish' },
    uk: { name: 'Українська', en: 'Ukrainian' },
    vi: { name: 'Tiếng Việt', en: 'Vietnamese' },
    'zh-CN': { name: '中文(简体)', en: 'Chinese Simplified' },
    [TRANSLATION_PSEUDOLANGUAGE]: { name: 'TRANSLATION', en: 'TRANSLATION' },
} as const;

export type Locale = keyof typeof LANGUAGES;

export type LocaleInfo = {
    name: string;
    en: string;
    complete?: boolean;
};

export default LANGUAGES as { [code in Locale]: LocaleInfo };
