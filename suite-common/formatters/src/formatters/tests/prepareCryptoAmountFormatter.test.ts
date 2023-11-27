import { NetworkSymbol } from '@suite-common/wallet-config';
import { PROTO } from '@trezor/connect';

import { prepareCryptoAmountFormatter } from '../prepareCryptoAmountFormatter';

const CryptoAmountFormatter = prepareCryptoAmountFormatter({
    coins: [],
    locale: 'en',
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    // @ts-expect-error - no need to test it with Intl for now
    intl: {},
});

const CryptoAmountFormatterSats = prepareCryptoAmountFormatter({
    coins: [],
    locale: 'en',
    bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
    // @ts-expect-error - no need to test it with Intl for now
    intl: {},
});

describe('CryptoAmountFormatter', () => {
    describe('Formats correctly to normal units', () => {
        it('BTC with symbol', () => {
            expect(
                CryptoAmountFormatter.format('300', {
                    symbol: 'btc',
                }),
            ).toBe('0.000003 BTC');
        });

        it('BTC without symbol', () => {
            expect(
                CryptoAmountFormatter.format('300', {
                    symbol: 'btc',
                    withSymbol: false,
                }),
            ).toBe('0.000003');
        });

        it('BTC balance with symbol', () => {
            expect(
                CryptoAmountFormatter.format('0.3', {
                    symbol: 'btc',
                    isBalance: true,
                }),
            ).toBe('0.3 BTC');
        });

        it('ETH balance with symbol + truncate decimals', () => {
            expect(
                CryptoAmountFormatter.format('0.020638700284758254', {
                    symbol: 'eth',
                    isBalance: true,
                }),
            ).toBe('0.02063870… ETH');
        });

        it('ETH balance with symbol + truncate decimals + hide ellipsis', () => {
            expect(
                CryptoAmountFormatter.format('0.020638700284758254', {
                    symbol: 'eth',
                    isBalance: true,
                    isEllipsisAppended: false,
                }),
            ).toBe('0.02063870 ETH');
        });

        it('ETH balance with units', () => {
            expect(
                CryptoAmountFormatter.format('148985107694640', {
                    symbol: 'eth',
                    isBalance: false,
                }),
            ).toBe('0.00014898… ETH');
        });

        it('Unknown network with symbol', () => {
            expect(
                CryptoAmountFormatter.format('300', {
                    symbol: 'unknown' as NetworkSymbol,
                }),
            ).toBe('300 UNKNOWN');
        });

        it('Unknown network without symbol', () => {
            expect(
                CryptoAmountFormatter.format('300', {
                    symbol: 'unknown' as NetworkSymbol,
                    withSymbol: false,
                }),
            ).toBe('300');
        });

        it('Unknown network balance with symbol', () => {
            expect(
                CryptoAmountFormatter.format('300', {
                    symbol: 'unknown' as NetworkSymbol,
                    isBalance: true,
                }),
            ).toBe('300 UNKNOWN');
        });
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
            ).toBe('30000000 sat');
        });

        it('TEST sats with symbol', () => {
            expect(
                CryptoAmountFormatterSats.format('300', {
                    symbol: 'test',
                }),
            ).toBe('300 sat TEST');
        });

        it('ETH balance with units', () => {
            expect(
                CryptoAmountFormatterSats.format('148985107694640', {
                    symbol: 'eth',
                    isBalance: false,
                }),
            ).toBe('0.00014898… ETH');
        });

        it('Unknown network with symbol', () => {
            expect(
                CryptoAmountFormatterSats.format('300', {
                    symbol: 'unknown' as NetworkSymbol,
                }),
            ).toBe('300 UNKNOWN');
        });

        it('Unknown network without symbol', () => {
            expect(
                CryptoAmountFormatterSats.format('300', {
                    symbol: 'unknown' as NetworkSymbol,
                    withSymbol: false,
                }),
            ).toBe('300');
        });

        it('Unknown network balance with symbol', () => {
            expect(
                CryptoAmountFormatterSats.format('300', {
                    symbol: 'unknown' as NetworkSymbol,
                    isBalance: true,
                }),
            ).toBe('300 UNKNOWN');
        });
    });
});
