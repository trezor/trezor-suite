import { FormatPercentageArgs, localizePercentage } from '../localizePercentage';

const NON_BREAKING_SPACE = '\u00A0';

describe('localizePercentage', () => {
    const testCases: Array<{ input: FormatPercentageArgs; output: string }> = [
        { input: { valueInFraction: 0.1, locale: 'en-US', numDecimals: 0 }, output: '10%' },
        { input: { valueInFraction: 0.041, locale: 'en-US', numDecimals: 2 }, output: '4.10%' },
        { input: { valueInFraction: 0.04, locale: 'en-US', numDecimals: 2 }, output: '4.00%' },
        { input: { locale: 'en-US', valueInFraction: 0.1234, numDecimals: 2 }, output: '12.34%' },

        // In Czech and in Slovak, the percent sign is spaced with a non-breaking space if the number is used as a noun.
        {
            input: { valueInFraction: 0.2345, locale: 'cs-CZ', numDecimals: 2 },
            output: `23,45${NON_BREAKING_SPACE}%`,
        },

        // In Turkish and some other Turkic languages, the percent sign precedes rather than follows the number, without an intervening space.
        { input: { valueInFraction: 0.2345, locale: 'tr-TR', numDecimals: 2 }, output: `%23,45` },
    ];

    testCases.forEach(row => {
        it(`Formats ${JSON.stringify(row.input.valueInFraction)} correctly`, () => {
            expect(localizePercentage(row.input)).toBe(row.output);
        });
    });
});
