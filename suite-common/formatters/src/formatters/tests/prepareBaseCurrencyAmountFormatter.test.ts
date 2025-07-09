import { createIntl } from 'react-intl';

import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';

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

    it('formats basic numbers', () => {
        expect(displaySymbolFormatter.format(asBaseCurrencyAmount(new BigNumber(123)), {})).toBe(
            'XAU 123',
        );
        expect(displaySymbolFormatter.format(asBaseCurrencyAmount(new BigNumber(0)), {})).toBe(
            'XAU 0',
        );
        expect(
            displaySymbolFormatter.format(
                asBaseCurrencyAmount(new BigNumber('123456789123456789123456789')),
                {},
            ),
        ).toBe('XAU 123,456,789,123,456,790,000,000,000.00');
    });

    it('uses significant digits: small number and keeps precision, but the bigger number gets rounded', () => {
        expect(
            displaySymbolFormatter.format(asBaseCurrencyAmount(new BigNumber(0.00000000001)), {}),
        ).toBe('XAU 0.00000000001');
        expect(
            displaySymbolFormatter.format(asBaseCurrencyAmount(new BigNumber(0.10000000001)), {}),
        ).toBe('XAU 0.1');
    });
});
