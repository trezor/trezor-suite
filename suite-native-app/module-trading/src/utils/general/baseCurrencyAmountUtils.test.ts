import { asNetworkSymbol } from '@suite-common/wallet-config';

import {
    getBaseCurrencyAmountFromCrypto,
    getCryptoAmountFromBaseCurrency,
} from './baseCurrencyAmountUtils';

describe('baseCurrencyAmountUtils', () => {
    describe('getBaseCurrencyAmountFromCrypto', () => {
        const btc = asNetworkSymbol('btc');
        const eth = asNetworkSymbol('eth');

        it.each([
            ['1.5', 20_000, btc, 'usd', false, false, '30000'],
            ['150000000', 20_000, btc, 'usd', true, false, '30000'],
            ['0.123456', 3, eth, 'usd', false, false, '0.37'],
            ['0', 20_000, btc, 'usd', false, false, '0'],
            ['0.123456789', 0.05, eth, 'btc', false, false, '0.00617284'],
            ['1', 0.05, eth, 'btc', false, true, '5000000'],
            ['1', 0.000000123, eth, 'btc', false, true, '12'],
            ['', 20_000, btc, 'usd', false, false, undefined],
            [undefined, 20_000, btc, 'usd', false, false, undefined],
            ['1', undefined, btc, 'usd', false, false, undefined],
            ['abc', 20_000, btc, 'usd', false, false, undefined],
        ] as const)(
            'converts %s at rate %s of %s to %s (sats: %s, base currency sats: %s) to %s',
            (
                cryptoAmount,
                rate,
                symbol,
                baseCurrency,
                isAmountInSats,
                isBaseCurrencyInSats,
                expected,
            ) => {
                expect(
                    getBaseCurrencyAmountFromCrypto({
                        cryptoAmount,
                        rate,
                        symbol,
                        baseCurrency,
                        isAmountInSats,
                        isBaseCurrencyInSats,
                    }),
                ).toBe(expected);
            },
        );
    });

    describe('getCryptoAmountFromBaseCurrency', () => {
        it.each([
            ['30000', 20_000, 8, false, false, '1.5'],
            ['30000', 20_000, 8, true, false, '150000000'],
            ['100', 30_000, 8, false, false, '0.00333333'],
            ['100', 30_000, 8, true, false, '333333'],
            ['100.', 30_000, 8, false, false, '0.00333333'],
            ['1', 3, 6, false, false, '0.333333'],
            ['5000000', 0.05, 18, false, true, '1'],
            ['0', 20_000, 8, false, false, '0'],
            ['', 20_000, 8, false, false, undefined],
            [undefined, 20_000, 8, false, false, undefined],
            ['100', undefined, 8, false, false, undefined],
            ['100', 0, 8, false, false, undefined],
            ['abc', 20_000, 8, false, false, undefined],
            ['abc', 0.05, 18, false, true, undefined],
        ] as const)(
            'converts %s at rate %s with %s decimals (sats: %s, base currency sats: %s) to %s',
            (
                baseCurrencyAmount,
                rate,
                decimals,
                isAmountInSats,
                isBaseCurrencyInSats,
                expected,
            ) => {
                expect(
                    getCryptoAmountFromBaseCurrency({
                        baseCurrencyAmount,
                        rate,
                        decimals,
                        isAmountInSats,
                        isBaseCurrencyInSats,
                    }),
                ).toBe(expected);
            },
        );
    });
});
