import { createIntl } from 'react-intl';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { prepareBaseCurrencyAmountFormatter } from '../prepareBaseCurrencyAmountFormatter';

const intlEn = createIntl({
    locale: 'en',
    messages: {},
});

const intlCsCZ = createIntl({
    locale: 'cs-CZ',
    messages: {},
});

const xauFormatter = prepareBaseCurrencyAmountFormatter({
    locale: 'en',
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    intl: intlEn,
    baseCurrency: 'xau',
    is24HourFormat: false,
});

const btcSatsFormatter = prepareBaseCurrencyAmountFormatter({
    locale: 'en',
    bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
    intl: intlEn,
    baseCurrency: 'btc',
    is24HourFormat: false,
});

const usdFormatterEnUs = prepareBaseCurrencyAmountFormatter({
    locale: 'en-US',
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    intl: intlEn,
    baseCurrency: 'usd',
    is24HourFormat: false,
});

const usdFormatterCsCZ = prepareBaseCurrencyAmountFormatter({
    locale: 'cs-CZ',
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    intl: intlCsCZ,
    baseCurrency: 'usd',
    is24HourFormat: false,
});

const czkFormatterCsCZ = prepareBaseCurrencyAmountFormatter({
    locale: 'cs-CZ',
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    intl: intlCsCZ,
    baseCurrency: 'czk',
    is24HourFormat: false,
});

describe(prepareBaseCurrencyAmountFormatter.name, () => {
    const dataProvider: Array<{ it?: string; input: string; expected: string }> = [
        { input: '123', expected: 'XAU 123.00' },
        { input: '0', expected: 'XAU 0.00' },
        {
            input: '123456789123456789123456789',
            expected: 'XAU 123,456,789,123,456,790,000,000,000.00',
        },
        {
            it: 'rounds to zero',
            input: '0.00000000001',
            expected: 'XAU 0.00',
        },
        {
            it: 'rounds to non zero',
            input: '0.10000000001',
            expected: 'XAU 0.10',
        },
        {
            it: 'do not show .00 for whole number < 1000',
            input: '923',
            expected: 'XAU 923.00',
        },
        {
            it: 'uses significant digits for < 1000',
            input: '923.1234',
            expected: 'XAU 923.12',
        },
    ];

    dataProvider.forEach(item =>
        it(item.it ?? `format ${item.input}`, () => {
            expect(xauFormatter.format(asBaseCurrencyAmount(new BigNumber(item.input)), {})).toBe(
                item.expected.replace(' ', '\u00a0'),
            );
        }),
    );

    it('formats the infinite fractions (1/3) uses significant digits', () => {
        expect(xauFormatter.format(asBaseCurrencyAmount(new BigNumber(1).div(3)), {})).toBe(
            'XAU 0.33'.replace(' ', '\u00a0'),
        );
    });

    it('formats value into sats', () => {
        expect(btcSatsFormatter.format(asBaseCurrencyAmount(new BigNumber('0.0001234')), {})).toBe(
            '12,340 sat'.replace(' ', '\u00a0'),
        );
    });

    describe('currency symbol respects canonical position for each currency', () => {
        it('USD in en-US locale stays as prefix', () => {
            expect(
                usdFormatterEnUs.format(asBaseCurrencyAmount(new BigNumber('0')), {}),
            ).toMatch(/^\$/);
        });

        it('USD in cs-CZ locale displays currency symbol as prefix', () => {
            const result = usdFormatterCsCZ.format(asBaseCurrencyAmount(new BigNumber('0')), {});
            // USD is canonically prefix: should start with the currency symbol
            expect(result).toMatch(/^US\$/);
        });

        it('USD negative value in cs-CZ locale formats with correct sign and currency prefix', () => {
            const result = usdFormatterCsCZ.format(asBaseCurrencyAmount(new BigNumber('-5')), {});
            // USD is canonically prefix: minus sign, then currency, then number
            expect(result).toMatch(/^-US\$/);
        });

        it('CZK in cs-CZ locale uses canonical suffix position', () => {
            const result = czkFormatterCsCZ.format(asBaseCurrencyAmount(new BigNumber('0')), {});
            // CZK is canonically suffix: should end with the currency symbol
            expect(result).toMatch(/Kč$/);
        });

        it('CZK in en-US locale is moved to suffix to match canonical position', () => {
            const result = usdFormatterEnUs.format(asBaseCurrencyAmount(new BigNumber('521')), {
                currency: 'CZK',
            });
            // CZK is canonically suffix: "521.00\u00a0CZK"
            expect(result).toMatch(/CZK$/);
            expect(result).not.toMatch(/^CZK/);
        });
    });
});
