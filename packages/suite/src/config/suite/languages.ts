export const TRANSLATION_PSEUDOLANGUAGE = 'lol' as const;

const LANGUAGES = {
    en: { name: 'English', en: 'English', type: 'official' },
    es: { name: 'Español', en: 'Spanish', type: 'official' },
    af: { name: 'Afrikaans', en: 'Afrikaans' },
    ar: { name: 'العربية‬', en: 'Arabic' },
    ca: { name: 'Català', en: 'Catalan' },
    cs: { name: 'Čeština', en: 'Czech', type: 'community' },
    da: { name: 'Dansk', en: 'Danish' },
    de: { name: 'Deutsch', en: 'German', type: 'official' },
    el: { name: 'Ελληνικά', en: 'Greek' },
    fi: { name: 'Suomi', en: 'Finnish' },
    fr: { name: 'Français', en: 'French', type: 'official' },
    he: { name: 'עברית‬', en: 'Hebrew' },
    hi: { name: 'हिन्दी', en: 'Hindi' },
    hu: { name: 'Magyar', en: 'Hungarian', type: 'community' },
    id: { name: 'Bahasa Indonesia', en: 'Indonesian' },
    it: { name: 'Italiano', en: 'Italian', type: 'community' },
    ja: { name: '日本語（ベータ版）', en: 'Japanese', type: 'community' },
    jv: { name: 'Basa Jawa', en: 'Javanese' },
    ko: { name: '한국어', en: 'Korean' },
    nl: { name: 'Nederlands', en: 'Dutch' },
    no: { name: 'Norsk', en: 'Norwegian' },
    pl: { name: 'Polski', en: 'Polish' },
    pt: { name: 'Português (BR)', en: 'Portuguese (BR)', type: 'community' },
    ro: { name: 'Română', en: 'Romanian' },
    ru: { name: 'Русский', en: 'Russian', type: 'community' },
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
    type?: 'official' | 'community';
};

export default LANGUAGES as { [code in Locale]: LocaleInfo };
