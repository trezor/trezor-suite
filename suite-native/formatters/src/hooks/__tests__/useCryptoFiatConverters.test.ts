import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { AmountUnit } from '@trezor/protobuf/src/definitions';
import { BigNumber } from '@trezor/utils';

import { useCryptoFiatConverters } from '../useCryptoFiatConverters';

const createPreloadedState = ({
    bitcoinAmountUnit = AmountUnit.BITCOIN,
    rates = { 'btc-usd': 50000 },
}: {
    bitcoinAmountUnit?: AmountUnit;
    rates?: Record<string, number>;
} = {}) => ({
    wallet: {
        settings: { localCurrency: 'usd', bitcoinAmountUnit },
        fiat: {
            current: Object.fromEntries(
                Object.entries(rates).map(([fiatRateKey, rate]) => [
                    fiatRateKey,
                    { rate, error: null },
                ]),
            ),
        },
    },
});

describe(useCryptoFiatConverters.name, () => {
    const renderUseCryptoFiatConverters = (
        symbol: NetworkSymbol | null,
        preloadedState: Record<string, unknown>,
    ) =>
        renderHookWithStoreProvider(() => useCryptoFiatConverters({ symbol }), {
            preloadedState,
        });

    it('converts between crypto and fiat in whole units', () => {
        const { result } = renderUseCryptoFiatConverters('btc', createPreloadedState());

        expect(result.current?.convertCryptoToFiat(BigNumber(2))?.toString()).toBe('100000');
        expect(
            result.current
                ?.convertFiatToCrypto(asBaseCurrencyAmount(BigNumber(100000)))
                ?.toString(),
        ).toBe('2');
    });

    it('converts between crypto and fiat in sats when the amount unit is satoshi', () => {
        const { result } = renderUseCryptoFiatConverters(
            'btc',
            createPreloadedState({ bitcoinAmountUnit: AmountUnit.SATOSHI }),
        );

        expect(result.current?.convertCryptoToFiat(BigNumber(100_000_000))?.toString()).toBe(
            '50000',
        );
        expect(
            result.current?.convertFiatToCrypto(asBaseCurrencyAmount(BigNumber(50000)))?.toString(),
        ).toBe('100000000');
    });

    it('returns null when the fiat rate is missing', () => {
        const { result } = renderUseCryptoFiatConverters(
            'btc',
            createPreloadedState({ rates: {} }),
        );

        expect(result.current).toBeNull();
    });

    it('returns null for a testnet coin even when a rate exists', () => {
        const { result } = renderUseCryptoFiatConverters(
            'test',
            createPreloadedState({ rates: { 'test-usd': 50000 } }),
        );

        expect(result.current).toBeNull();
    });

    it('returns null when symbol is null', () => {
        const { result } = renderUseCryptoFiatConverters(null, createPreloadedState());

        expect(result.current).toBeNull();
    });

    it('returns referentially stable converters across rerenders with unchanged state', () => {
        const { result, rerender } = renderUseCryptoFiatConverters('btc', createPreloadedState());
        const firstResult = result.current;

        rerender(undefined);

        expect(firstResult).not.toBeNull();
        expect(result.current).toBe(firstResult);
    });
});
