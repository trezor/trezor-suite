import { createIntl } from 'react-intl';

import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { FormatterConfig } from '../../types';
import { prepareBaseCurrencyAmountFormatter } from '../prepareBaseCurrencyAmountFormatter';

const intl = createIntl({
    locale: 'en',
    messages: {},
});

const formatterConfig: FormatterConfig = {
    locale: 'en',
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    intl,
    baseCurrency: 'xau',
    is24HourFormat: false,
};

describe(prepareBaseCurrencyAmountFormatter.name, () => {
    let displaySymbolFormatter: ReturnType<typeof prepareBaseCurrencyAmountFormatter>;

    beforeEach(() => {
        displaySymbolFormatter = prepareBaseCurrencyAmountFormatter(formatterConfig);
    });

    const dataProvider: Array<{ it?: string; input: string; expected: string }> = [
        { input: '123', expected: 'XAU 123' },
        { input: '0', expected: 'XAU 0' },
        {
            input: '123456789123456789123456789',
            expected: 'XAU 123,456,789,123,456,790,000,000,000',
        },
        {
            it: 'uses significant digits: small number and keeps precision',
            input: '0.00000000001',
            expected: 'XAU 0.00000000001',
        },
        {
            it: 'uses significant digits: but the bigger number gets rounded',
            input: '0.10000000001',
            expected: 'XAU 0.1',
        },
        {
            it: 'do not show .00 for whole number < 1000',
            input: '923',
            expected: 'XAU 923',
        },
        {
            it: 'uses significant digits for < 1000',
            input: '923.1234',
            expected: 'XAU 923.12',
        },
    ];

    dataProvider.forEach(item =>
        it(item.it ?? `format ${item.input}`, () => {
            expect(
                displaySymbolFormatter.format(asBaseCurrencyAmount(new BigNumber(item.input)), {}),
            ).toBe(item.expected.replace(' ', ' '));
        }),
    );
});
