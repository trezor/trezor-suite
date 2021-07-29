const LANGUAGES = {
    en: { name: 'English', en: 'English', complete: true },
    // bn: { name: 'Bengali', en: 'Bengali' },
    cs: { name: 'Česky', en: 'Czech' },
    de: { name: 'Deutsch', en: 'German' },
    // el: { name: 'Ελληνικά', en: 'Greek' },
    es: { name: 'Español (BETA)', en: 'Spanish (BETA)', complete: true },
    // fr: { name: 'Français', en: 'French' },
    id: { name: 'Bahasa Indonesia', en: 'Indonesian' },
    // it: { name: 'Italiano', en: 'Italian' },
    // ja: { name: '日本語', en: 'Japanese' },
    // nl: { name: 'Nederlands', en: 'Dutch' },
    // pl: { name: 'Polski', en: 'Polish' },
    // pt: { name: 'Português', en: 'Portuguese' },
    ru: { name: 'Русский', en: 'Russian' },
    // uk: { name: 'Українська', en: 'Ukrainian' },
    'zh-CN': { name: '中文(简体)', en: 'Chinese Simplified' },
    // 'zh-TW': { name: '中文(台灣)', en: 'Chinese Traditional' },
} as const;

export type Locale = keyof typeof LANGUAGES;

export type LocaleInfo = {
    name: string;
    en: string;
    complete?: boolean;
};

export default LANGUAGES as { [code in Locale]: LocaleInfo };
