import { LANGUAGES, type Locale as SuiteLocale } from '@suite-common/suite-types';

import { loadDateFnsLocale } from './useLocales';

// Which date-fns locale a language maps to cannot be checked by the type system - pointing
// 'ja-JP' at the Spanish subpath would compile fine - so the resolved code is pinned here.
const EXPECTED_DATE_FNS_CODES = {
    'en-US': 'en-US',
    'es-ES': 'es',
    'cs-CZ': 'cs',
    'de-DE': 'de',
    'fr-FR': 'fr',
    'hu-HU': 'hu',
    'id-ID': 'id',
    'it-IT': 'it',
    'ja-JP': 'ja',
    'ko-KR': 'ko',
    'pt-BR': 'pt-BR',
    'ru-RU': 'ru',
    'tr-TR': 'tr',
    'uk-UA': 'uk',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
} as const satisfies Record<SuiteLocale, string>;

describe('loadDateFnsLocale', () => {
    it('covers every language Suite offers', () => {
        expect(Object.keys(EXPECTED_DATE_FNS_CODES).sort()).toEqual(Object.keys(LANGUAGES).sort());
    });

    it.each(Object.entries(EXPECTED_DATE_FNS_CODES))(
        'loads the %s date-fns locale with code %s',
        async (language, expectedCode) => {
            const locale = await loadDateFnsLocale(language as SuiteLocale);

            expect(locale.code).toBe(expectedCode);
            expect(locale.localize).toBeDefined();
        },
    );
});
