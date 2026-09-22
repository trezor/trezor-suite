import { createIntl } from 'react-intl';

import { PROTO } from '@trezor/connect';

import { preparePercentageFormatter } from './preparePercentageFormatter';

const prepare = (locale: string) =>
    preparePercentageFormatter({
        locale,
        intl: createIntl({ locale, messages: {} }),
        bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
        baseCurrency: 'usd',
        is24HourFormat: true,
    });

describe(preparePercentageFormatter.name, () => {
    it.each([
        { locale: 'en', value: 5.63, expected: '5.63', expectedWithSymbol: '5.63%' },
        { locale: 'cs', value: 5.63, expected: '5,63', expectedWithSymbol: '5,63\u00a0%' },
        { locale: 'en', value: 2.11491, expected: '2.11', expectedWithSymbol: '2.11%' },
        { locale: 'cs', value: 3, expected: '3', expectedWithSymbol: '3\u00a0%' },
        { locale: 'en', value: 0, expected: '0', expectedWithSymbol: '0%' },
    ])('formats $value in $locale', ({ locale, value, expected, expectedWithSymbol }) => {
        const formatter = prepare(locale);

        expect(formatter.format(value)).toBe(expected);
        expect(formatter.format(value, { withSymbol: true })).toBe(expectedWithSymbol);
    });

    it.each([
        { value: 1.005, expected: '1.01' },
        { value: 2.675, expected: '2.68' },
        { value: 0.125, expected: '0.13' },
    ])(
        'rounds the midpoint $value the same way with and without the symbol',
        ({ value, expected }) => {
            const formatter = prepare('en');

            expect(formatter.format(value)).toBe(expected);
            expect(formatter.format(value, { withSymbol: true })).toBe(`${expected}%`);
        },
    );
});
