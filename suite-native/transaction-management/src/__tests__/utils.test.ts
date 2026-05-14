import { type NetworkSymbol } from '@suite-common/wallet-config';

import { getFeeDecimals, getFeeValue } from '../utils';

describe('utils', () => {
    describe('getFeeDecimals', () => {
        it.each(['eth', 'pol', 'bsc', 'arb', 'base', 'op', 'etc', 'tsep', 'thod'])(
            'should return 9 decimals for Ethereum network: %s',
            symbol => {
                expect(getFeeDecimals({ symbol: symbol as NetworkSymbol })).toBe(9);
            },
        );

        it.each(['btc', 'ltc', 'bch', 'doge', 'zec', 'test', 'regtest'])(
            'should return 2 decimals for Bitcoin network: %s',
            symbol => {
                expect(getFeeDecimals({ symbol: symbol as NetworkSymbol })).toBe(2);
            },
        );

        it.each(['ada', 'sol', 'xrp', 'xlm', 'dsol', 'txrp', 'txlm'])(
            'should return null for other network type: %s',
            symbol => {
                expect(getFeeDecimals({ symbol: symbol as NetworkSymbol })).toBeNull();
            },
        );
    });

    describe('getFeeValue', () => {
        it('should return undefined when feeRate or symbol is missing', () => {
            expect(getFeeValue({ feeRate: undefined, symbol: 'btc' })).toBeUndefined();
            expect(getFeeValue({ feeRate: '', symbol: 'btc' })).toBeUndefined();
            expect(getFeeValue({ feeRate: '100', symbol: undefined })).toBeUndefined();
        });

        it.each([
            ['100.123456', 'btc', '100.12', 'normal precision'],
            ['0.001', 'btc', '0', 'very small number'],
            ['999999999.99999', 'btc', '999999999.99', 'large number'],
        ])(
            'should round down Bitcoin fees to 2 decimals: %s -> %s (%s)',
            (feeRate, symbol, expected) => {
                expect(getFeeValue({ feeRate, symbol: symbol as NetworkSymbol })).toBe(expected);
            },
        );

        it.each([
            ['1000000000.1234567890123', 'eth', '1000000000.123456789', 'normal precision'],
            ['0.0000000001', 'eth', '0', 'very small number'],
            ['999999999.999999999999', 'eth', '999999999.999999999', 'large number'],
        ])(
            'should round down Ethereum fees to 9 decimals: %s -> %s (%s)',
            (feeRate, symbol, expected) => {
                expect(getFeeValue({ feeRate, symbol: symbol as NetworkSymbol })).toBe(expected);
            },
        );

        it('should return original value for networks without decimal limits', () => {
            expect(getFeeValue({ feeRate: '100.123456789012345', symbol: 'ada' })).toBe(
                '100.123456789012345',
            );
            expect(getFeeValue({ feeRate: '0.000000000000001', symbol: 'sol' })).toBe(
                '0.000000000000001',
            );
        });

        it.each(['btc', 'ltc', 'bch', 'doge', 'zec', 'test', 'regtest'])(
            'should work consistently for Bitcoin network variant: %s',
            symbol => {
                expect(getFeeValue({ feeRate: '100.999', symbol: symbol as NetworkSymbol })).toBe(
                    '100.99',
                );
            },
        );

        it.each(['eth', 'pol', 'bsc', 'arb', 'base', 'op', 'etc', 'tsep', 'thod'])(
            'should work consistently for Ethereum network variant: %s',
            symbol => {
                expect(
                    getFeeValue({
                        feeRate: '100.9999999999999',
                        symbol: symbol as NetworkSymbol,
                    }),
                ).toBe('100.999999999');
            },
        );
    });
});
