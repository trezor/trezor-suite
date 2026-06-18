import { createIntl } from 'react-intl';

import { PROTO } from '@trezor/connect';

import { prepareCryptoAmountFormatterFast } from '../prepareCryptoAmountFormatterFast';

const intl = createIntl({ locale: 'en-US' });

const CryptoAmountFormatterFast = prepareCryptoAmountFormatterFast({
    intl,
    locale: 'en-US',
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    baseCurrency: 'usd',
    is24HourFormat: true,
});

const CryptoAmountFormatterSats = prepareCryptoAmountFormatterFast({
    intl,
    locale: 'en-US',
    baseCurrency: 'usd',
    is24HourFormat: true,
    bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
});

describe('CryptoAmountFormatterFast', () => {
    describe('Formats correctly to normal units', () => {
        it('BTC with symbol', () => {
            expect(
                CryptoAmountFormatterFast.format('300', {
                    symbol: 'btc',
                }),
            ).toBe('0.000003 BTC');
        });

        it('BTC without symbol', () => {
            expect(
                CryptoAmountFormatterFast.format('300', {
                    symbol: 'btc',
                    withSymbol: false,
                }),
            ).toBe('0.000003');
        });

        it.each([
            ['0.3', '0.3 BTC'],
            ['0.3000', '0.3 BTC'],
            ['3.000', '3 BTC'],
            ['000.3', '0.3 BTC'],
            ['003', '3 BTC'],
            ['0', '0 BTC'],
            ['000', '0 BTC'],
            ['3000', '3,000 BTC'],
            ['0033.3300', '33.33 BTC'],
            ['0033', '33 BTC'],
        ])('BTC balance with symbol, case %#', (inputValue, expectedValue) => {
            expect(
                CryptoAmountFormatterFast.format(inputValue, {
                    symbol: 'btc',
                    isBalance: true,
                }),
            ).toBe(expectedValue);
        });

        it('ETH balance with symbol + truncate decimals', () => {
            expect(
                CryptoAmountFormatterFast.format('0.020638700284758254', {
                    symbol: 'eth',
                    isBalance: true,
                }),
            ).toBe('0.0206387… ETH');
        });

        it('ETH balance with symbol + truncate decimals + hide ellipsis', () => {
            expect(
                CryptoAmountFormatterFast.format('0.020638700284758254', {
                    symbol: 'eth',
                    isBalance: true,
                    isEllipsisAppended: false,
                }),
            ).toBe('0.0206387 ETH');
        });

        it('ETH balance with units', () => {
            expect(
                CryptoAmountFormatterFast.format('148985107694640', {
                    symbol: 'eth',
                    isBalance: false,
                }),
            ).toBe('0.00014899… ETH');
        });

        it('ETH fee preserves all 18 decimals without Number precision loss', () => {
            expect(
                CryptoAmountFormatterFast.format('1005309106970022', {
                    symbol: 'eth',
                    isBalance: false,
                    maxDisplayedDecimals: 18,
                }),
            ).toBe('0.001005309106970022 ETH');
        });

        describe('Formats correctly to Sats units', () => {
            it('BTC sats with symbol', () => {
                expect(
                    CryptoAmountFormatterSats.format('300', {
                        symbol: 'btc',
                    }),
                ).toBe('300 sat');
            });

            it('BTC sats without symbol', () => {
                expect(
                    CryptoAmountFormatterSats.format('300', {
                        symbol: 'btc',
                        withSymbol: false,
                    }),
                ).toBe('300');
            });

            it('BTC sats balance with symbol', () => {
                expect(
                    CryptoAmountFormatterSats.format('0.3', {
                        symbol: 'btc',
                        isBalance: true,
                    }),
                ).toBe('30,000,000 sat');
            });

            it('TEST sats with symbol', () => {
                expect(
                    CryptoAmountFormatterSats.format('300', {
                        symbol: 'test',
                    }),
                ).toBe('300 sat TEST');
            });
        });
    });
});
