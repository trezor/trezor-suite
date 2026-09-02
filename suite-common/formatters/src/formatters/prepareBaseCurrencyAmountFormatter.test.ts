import { createIntl } from 'react-intl';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { prepareBaseCurrencyAmountFormatter } from './prepareBaseCurrencyAmountFormatter';

const intl = createIntl({
    locale: 'en',
    messages: {},
});

const xauFormatter = prepareBaseCurrencyAmountFormatter({
    locale: 'en',
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    intl,
    baseCurrency: 'xau',
    is24HourFormat: false,
});

const btcSatsFormatter = prepareBaseCurrencyAmountFormatter({
    locale: 'en',
    bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
    intl,
    baseCurrency: 'btc',
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
                item.expected.replace(' ', ' '),
            );
        }),
    );

    it('formats the infinite fractions (1/3) uses significant digits', () => {
        expect(xauFormatter.format(asBaseCurrencyAmount(new BigNumber(1).div(3)), {})).toBe(
            'XAU 0.33'.replace(' ', ' '),
        );
    });

    it('formats value into sats', () => {
        expect(btcSatsFormatter.format(asBaseCurrencyAmount(new BigNumber('0.0001234')), {})).toBe(
            '12,340 sat'.replace(' ', ' '),
        );
    });
});
