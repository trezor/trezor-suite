import { createIntl } from 'react-intl';

import { PROTO } from '@trezor/connect';

import { prepareCryptoAmountFormatterNonPrecise } from '../prepareCryptoAmountFormatterNonPrecise';

const intl = createIntl({ locale: 'en-US' });

const CryptoAmountFormatterNonPrecise = prepareCryptoAmountFormatterNonPrecise({
    intl,
    locale: 'en-US',
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    baseCurrency: 'usd',
    is24HourFormat: true,
});

const CryptoAmountFormatterNonPreciseSats = prepareCryptoAmountFormatterNonPrecise({
    intl,
    locale: 'en-US',
    baseCurrency: 'usd',
    is24HourFormat: true,
    bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
});

describe('CryptoAmountFormatterNonPrecise', () => {
    describe('Formats correctly to normal units', () => {
        it('BTC with symbol', () => {
            expect(
                CryptoAmountFormatterNonPrecise.format('300', {
                    symbol: 'btc',
                }),
            ).toBe('0.000003 BTC');
        });

        it('BTC without symbol', () => {
            expect(
                CryptoAmountFormatterNonPrecise.format('300', {
                    symbol: 'btc',
                    withSymbol: false,
                }),
            ).toBe('0.000003');
        });

        it.each([
            ['0.3', '0.3 BTC'],
            ['3.000', '3 BTC'],
            ['0', '0 BTC'],
            ['3000', '3,000 BTC'],
            ['0033', '33 BTC'],
        ])('BTC balance with symbol, case %#', (inputValue, expectedValue) => {
            expect(
                CryptoAmountFormatterNonPrecise.format(inputValue, {
                    symbol: 'btc',
                    isBalance: true,
                }),
            ).toBe(expectedValue);
        });

        it('BTC sats with symbol', () => {
            expect(
                CryptoAmountFormatterNonPreciseSats.format('300', {
                    symbol: 'btc',
                }),
            ).toBe('300 sat');
        });

        it('BTC sats balance with symbol', () => {
            expect(
                CryptoAmountFormatterNonPreciseSats.format('0.3', {
                    symbol: 'btc',
                    isBalance: true,
                }),
            ).toBe('30,000,000 sat');
        });

        it('TEST sats with symbol', () => {
            expect(
                CryptoAmountFormatterNonPreciseSats.format('300', {
                    symbol: 'test',
                }),
            ).toBe('300 sat TEST');
        });
    });
});
