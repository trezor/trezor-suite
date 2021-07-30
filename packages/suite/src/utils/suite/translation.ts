import LANGUAGES, { Locale, TRANSLATION_PSEUDOLANGUAGE } from '@suite-config/languages';

const TRANSLATION_MODE_FLAG = 'translation_mode';

export const isTranslationMode = () => localStorage.getItem(TRANSLATION_MODE_FLAG) === 'true';

export const setTranslationMode = (value: boolean) => {
    if (value !== isTranslationMode()) {
        if (value) localStorage.setItem(TRANSLATION_MODE_FLAG, 'true');
        else localStorage.removeItem(TRANSLATION_MODE_FLAG);
        window.location.reload();
    }
};

/**
 * Ensures that when translation mode is on, only translation pseudolanguage is used,
 * and vice versa, when translation mode is off, pseudolanguage is never used.
 */
export const ensureLocale = (loc: string): Locale => {
    const translationMode = isTranslationMode();
    if (translationMode) return TRANSLATION_PSEUDOLANGUAGE;
    if (loc === TRANSLATION_PSEUDOLANGUAGE) return 'en';
    return loc in LANGUAGES ? (loc as Locale) : 'en';
};
