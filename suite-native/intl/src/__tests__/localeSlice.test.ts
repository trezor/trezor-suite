import { LocaleSliceRootState, LocaleTag, selectIsLanguageLocaleSupported } from '../localeSlice';

describe('selectIsLanguageLocaleSupported', () => {
    const testCases = [
        {
            description:
                'should return true when user selected locale is "system" and system locale is officially supported',
            reduxLocaleTag: 'system',
            systemLocaleTag: 'en-US',
            expectedResult: true,
        },
        {
            description:
                'should return false when user selected locale is "system" and system locale is community supported',
            reduxLocaleTag: 'system',
            systemLocaleTag: 'cs-CZ',
            expectedResult: false,
        },
        {
            description:
                'should return false when user selected locale is "system" and system locale is not supported',
            reduxLocaleTag: 'system',
            systemLocaleTag: 'fr-FR',
            expectedResult: false,
        },
        {
            description:
                'should return true when user selected locale is a supported language (official)',
            reduxLocaleTag: 'en-US',
            systemLocaleTag: 'en-US',
            expectedResult: true,
        },
        {
            description:
                'should return true when user selected locale is a supported language (community)',
            reduxLocaleTag: 'cs-CZ',
            systemLocaleTag: 'en-US',
            expectedResult: true,
        },
    ] as const satisfies {
        description: string;
        reduxLocaleTag: LocaleTag;
        systemLocaleTag: string;
        expectedResult: boolean;
    }[];

    it.each(testCases)('$description', ({ reduxLocaleTag, systemLocaleTag, expectedResult }) => {
        const state: LocaleSliceRootState = {
            locale: {
                localeTag: reduxLocaleTag,
            },
        };

        expect(selectIsLanguageLocaleSupported(state, systemLocaleTag)).toBe(expectedResult);
    });
});
