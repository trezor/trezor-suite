import { createIntl } from 'react-intl';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';

import { NON_BREAKING_SPACE, prepareCryptoAmountFormatter } from './prepareCryptoAmountFormatter';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const usdtSymbol = 'USDT' as TokenSymbol;

const intl = createIntl({ locale: 'en-US' });

const CryptoAmountFormatter = prepareCryptoAmountFormatter({
    intl,
    locale: 'en-US',
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    baseCurrency: 'usd',
    is24HourFormat: true,
});

const CryptoAmountFormatterSats = prepareCryptoAmountFormatter({
    intl,
    locale: 'en-US',
    baseCurrency: 'usd',
    is24HourFormat: true,
    bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
});

const CryptoAmountFormatterCzech = prepareCryptoAmountFormatter({
    intl,
    locale: 'cs-CZ',
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    baseCurrency: 'usd',
    is24HourFormat: true,
});

describe('CryptoAmountFormatter', () => {
    describe('Money-like tokens (6 decimals) compact formatting', () => {
        it.each([
            { value: '21.543', expected: `21.54${NON_BREAKING_SPACE}USDT` },
            { value: '2', expected: `2.00${NON_BREAKING_SPACE}USDT` },
            { value: '0.5', expected: `0.50${NON_BREAKING_SPACE}USDT` },
            { value: '0.009', expected: `<0.01${NON_BREAKING_SPACE}USDT` },
            { value: '0', expected: `0${NON_BREAKING_SPACE}USDT` },
            { value: '1234567.899', expected: `1.23M${NON_BREAKING_SPACE}USDT` },
        ])('formats $value as money for a 6-decimal token', ({ value, expected }) => {
            expect(
                CryptoAmountFormatter.format(value, {
                    symbol: usdtSymbol,
                    isBalance: true,
                    formatStyle: 'compact-balance',
                    tokenDecimals: 6,
                }),
            ).toBe(expected);
        });

        it('does not apply money formatting to tokens with other decimals', () => {
            expect(
                CryptoAmountFormatter.format('0.009', {
                    symbol: usdtSymbol,
                    isBalance: true,
                    formatStyle: 'compact-balance',
                    tokenDecimals: 18,
                }),
            ).toBe(`0.009${NON_BREAKING_SPACE}USDT`);
        });

        it.each([
            { value: '0.009', tokenDecimals: 6, expected: `<0,01${NON_BREAKING_SPACE}USDT` },
            { value: '0.000009', tokenDecimals: 18, expected: `<0,00001${NON_BREAKING_SPACE}USDT` },
        ])('localizes compact dust threshold for $value', ({ value, tokenDecimals, expected }) => {
            expect(
                CryptoAmountFormatterCzech.format(value, {
                    symbol: usdtSymbol,
                    isBalance: true,
                    formatStyle: 'compact-balance',
                    tokenDecimals,
                }),
            ).toBe(expected);
        });
    });

    describe('Formats a compact balance shown in sats', () => {
        it.each([
            { initialValue: '0.00098419', expected: `98,419${NON_BREAKING_SPACE}sat` },
            { initialValue: '0.00000001', expected: `1${NON_BREAKING_SPACE}sat` },
            { initialValue: '1.5', expected: `150,000,000${NON_BREAKING_SPACE}sat` },
            { initialValue: '0', expected: `0${NON_BREAKING_SPACE}sat` },
        ] as const)('formats $initialValue BTC as $expected', ({ initialValue, expected }) => {
            expect(
                CryptoAmountFormatterSats.format(initialValue, {
                    symbol: btcSymbol,
                    isBalance: true,
                    formatStyle: 'compact-balance',
                }),
            ).toBe(expected);
        });
    });

    describe('Formats correctly to normal units', () => {
        it('BTC with symbol', () => {
            expect(
                CryptoAmountFormatter.format('300', {
                    symbol: btcSymbol,
                }),
            ).toBe(`0.000003${NON_BREAKING_SPACE}BTC`);
        });

        it('BTC without symbol', () => {
            expect(
                CryptoAmountFormatter.format('300', {
                    symbol: btcSymbol,
                    withSymbol: false,
                }),
            ).toBe('0.000003');
        });

        it('renders the amount alone when the symbol is empty (token without metadata)', () => {
            expect(
                CryptoAmountFormatter.format('300', {
                    symbol: '' as TokenSymbol,
                }),
            ).toBe('300');
        });

        it.each([
            ['0.3', `0.3${NON_BREAKING_SPACE}BTC`],
            ['0.3000', `0.3${NON_BREAKING_SPACE}BTC`],
            ['3.000', `3${NON_BREAKING_SPACE}BTC`],
            ['000.3', `0.3${NON_BREAKING_SPACE}BTC`],
            ['003', `3${NON_BREAKING_SPACE}BTC`],
            ['0', `0${NON_BREAKING_SPACE}BTC`],
            ['000', `0${NON_BREAKING_SPACE}BTC`],
            ['3000', `3,000${NON_BREAKING_SPACE}BTC`],
            ['0033.3300', `33.33${NON_BREAKING_SPACE}BTC`],
            ['0033', `33${NON_BREAKING_SPACE}BTC`],
        ])('BTC balance with symbol, case %#', (inputValue, expectedValue) => {
            expect(
                CryptoAmountFormatter.format(inputValue, {
                    symbol: btcSymbol,
                    isBalance: true,
                }),
            ).toBe(expectedValue);
        });

        it('ETH balance with symbol + truncate decimals', () => {
            expect(
                CryptoAmountFormatter.format('0.020638700284758254', {
                    symbol: ethSymbol,
                    isBalance: true,
                }),
            ).toBe(`0.0206387…${NON_BREAKING_SPACE}ETH`);
        });

        it('ETH balance with symbol + truncate decimals + hide ellipsis', () => {
            expect(
                CryptoAmountFormatter.format('0.020638700284758254', {
                    symbol: ethSymbol,
                    isBalance: true,
                    isEllipsisAppended: false,
                }),
            ).toBe(`0.0206387${NON_BREAKING_SPACE}ETH`);
        });

        it('ETH balance with units', () => {
            expect(
                CryptoAmountFormatter.format('148985107694640', {
                    symbol: ethSymbol,
                    isBalance: false,
                }),
            ).toBe(`0.00014898…${NON_BREAKING_SPACE}ETH`);
        });

        it('ETH fee preserves all 18 decimals without Number precision loss', () => {
            expect(
                CryptoAmountFormatter.format('1005309106970022', {
                    symbol: ethSymbol,
                    isBalance: false,
                    maxDisplayedDecimals: 18,
                }),
            ).toBe(`0.001005309106970022${NON_BREAKING_SPACE}ETH`);
        });

        it.each([
            {
                initialValue: '1',
                compact: `1.00${NON_BREAKING_SPACE}ETH`,
                exact: `1${NON_BREAKING_SPACE}ETH`,
            },
            {
                initialValue: '1.2',
                compact: `1.20${NON_BREAKING_SPACE}ETH`,
                exact: `1.2${NON_BREAKING_SPACE}ETH`,
            },
            {
                initialValue: '1.239',
                compact: `1.23${NON_BREAKING_SPACE}ETH`,
                exact: `1.239${NON_BREAKING_SPACE}ETH`,
            },
            {
                initialValue: '0.123456789',
                compact: `0.12345${NON_BREAKING_SPACE}ETH`,
                exact: `0.12345678…${NON_BREAKING_SPACE}ETH`,
            },
            {
                initialValue: '0.999999999',
                compact: `0.99999${NON_BREAKING_SPACE}ETH`,
                exact: `0.99999999…${NON_BREAKING_SPACE}ETH`,
            },
            {
                initialValue: '0.123456',
                compact: `0.12345${NON_BREAKING_SPACE}ETH`,
                exact: `0.123456${NON_BREAKING_SPACE}ETH`,
            },
            {
                initialValue: '0.000009',
                compact: `<0.00001${NON_BREAKING_SPACE}ETH`,
                exact: `0.000009${NON_BREAKING_SPACE}ETH`,
            },
            {
                initialValue: '999999.999',
                compact: `999,999.99${NON_BREAKING_SPACE}ETH`,
                exact: `999,999.999${NON_BREAKING_SPACE}ETH`,
            },
            {
                initialValue: '1000000',
                compact: `1.00M${NON_BREAKING_SPACE}ETH`,
                exact: `1,000,000${NON_BREAKING_SPACE}ETH`,
            },
            {
                initialValue: '1234567.899',
                compact: `1.23M${NON_BREAKING_SPACE}ETH`,
                exact: `1,234,567.899${NON_BREAKING_SPACE}ETH`,
            },
            {
                initialValue: '1000000000',
                compact: `1.00B${NON_BREAKING_SPACE}ETH`,
                exact: `1,000,000,000${NON_BREAKING_SPACE}ETH`,
            },
            {
                initialValue: '1234567890',
                compact: `1.23B${NON_BREAKING_SPACE}ETH`,
                exact: `1,234,567,890${NON_BREAKING_SPACE}ETH`,
            },
        ])('formats ETH balance with symbol, case %#', ({ initialValue, compact, exact }) => {
            expect(
                CryptoAmountFormatter.format(initialValue, {
                    symbol: ethSymbol,
                    isBalance: true,
                    formatStyle: 'compact-balance',
                }),
            ).toBe(compact);
            expect(
                CryptoAmountFormatter.format(initialValue, {
                    symbol: ethSymbol,
                    isBalance: true,
                }),
            ).toBe(exact);
        });

        describe('Formats correctly to Sats units', () => {
            it('BTC sats with symbol', () => {
                expect(
                    CryptoAmountFormatterSats.format('300', {
                        symbol: btcSymbol,
                    }),
                ).toBe(`300${NON_BREAKING_SPACE}sat`);
            });

            it('BTC sats without symbol', () => {
                expect(
                    CryptoAmountFormatterSats.format('300', {
                        symbol: btcSymbol,
                        withSymbol: false,
                    }),
                ).toBe('300');
            });

            it('BTC sats balance with symbol', () => {
                expect(
                    CryptoAmountFormatterSats.format('0.3', {
                        symbol: btcSymbol,
                        isBalance: true,
                    }),
                ).toBe(`30,000,000${NON_BREAKING_SPACE}sat`);
            });

            it('TEST sats with symbol', () => {
                expect(
                    CryptoAmountFormatterSats.format('300', {
                        symbol: asNetworkSymbol('test'),
                    }),
                ).toBe(`300${NON_BREAKING_SPACE}sat TEST`);
            });
        });
    });
});
