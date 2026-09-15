import { type Store } from '@reduxjs/toolkit';

import {
    type FiatRatesRootState,
    type WalletSettingsRootState,
    fiatRatesInitialState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import { type Rate, asTimestamp, toTokenAddress } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type LocaleSliceRootState, localeInitialState, localeReducer } from '@suite-native/intl';
import {
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { useFiatFromCryptoValue } from './useFiatFromCryptoValue';

type State = FiatRatesRootState & WalletSettingsRootState & LocaleSliceRootState;

let store: Store<State>;

type SetNewStoreMockupParams = {
    localCurrency?: BaseCurrencyCode;
    currentRates?: Record<string, Rate>;
};

const createRate = (rate: number): Rate => ({
    rate,
    lastTickerTimestamp: asTimestamp(0),
    lastSuccessfulFetchTimestamp: asTimestamp(0),
    isLoading: false,
    error: null,
    ticker: { symbol: 'btc' },
});

const setNewStoreMockup = ({
    localCurrency = 'usd',
    currentRates = {},
}: SetNewStoreMockupParams) => {
    store = createLightStore({
        reducer: {
            locale: localeReducer,
            wallet: createStaticReducer({
                settings: { ...initialWalletSettingsState, localCurrency },
                fiat: { ...fiatRatesInitialState, current: currentRates },
            }),
        },
        preloadedState: {
            locale: localeInitialState,
        },
    });
};

describe(useFiatFromCryptoValue.name, () => {
    const renderUseFiatFromCryptoValue = async (
        params: Parameters<typeof useFiatFromCryptoValue>[0],
    ) =>
        await renderHookWithStoreProvider(() => useFiatFromCryptoValue(params), {
            services: { store },
        });

    it('converts a crypto balance to a display-rounded fiat amount', async () => {
        setNewStoreMockup({
            currentRates: { [getFiatRateKey('btc', 'usd')]: createRate(12.528) },
        });
        const { result } = await renderUseFiatFromCryptoValue({
            cryptoValue: '1',
            symbol: 'btc',
            isBalance: true,
        });

        expect(result.current?.toFixed(2)).toBe('12.53');
    });

    it('returns the same instance while the rendered amount is unchanged', async () => {
        setNewStoreMockup({
            currentRates: { [getFiatRateKey('btc', 'usd')]: createRate(12.523) },
        });
        const { result: first } = await renderUseFiatFromCryptoValue({
            cryptoValue: '1',
            symbol: 'btc',
            isBalance: true,
        });

        setNewStoreMockup({
            currentRates: { [getFiatRateKey('btc', 'usd')]: createRate(12.5238) },
        });
        const { result: second } = await renderUseFiatFromCryptoValue({
            cryptoValue: '1',
            symbol: 'btc',
            isBalance: true,
        });

        expect(first.current?.toFixed(2)).toBe('12.52');
        expect(second.current).toBe(first.current);
    });

    it('returns a different amount when the rendered value changes', async () => {
        setNewStoreMockup({
            currentRates: { [getFiatRateKey('btc', 'usd')]: createRate(12.523) },
        });
        const { result: first } = await renderUseFiatFromCryptoValue({
            cryptoValue: '1',
            symbol: 'btc',
            isBalance: true,
        });

        setNewStoreMockup({
            currentRates: { [getFiatRateKey('btc', 'usd')]: createRate(12.528) },
        });
        const { result: second } = await renderUseFiatFromCryptoValue({
            cryptoValue: '1',
            symbol: 'btc',
            isBalance: true,
        });

        expect(second.current).not.toBe(first.current);
        expect(second.current?.toFixed(2)).toBe('12.53');
    });

    it('converts a value in sats to network units before the fiat conversion', async () => {
        setNewStoreMockup({
            currentRates: { [getFiatRateKey('btc', 'usd')]: createRate(12.528) },
        });
        const { result } = await renderUseFiatFromCryptoValue({
            cryptoValue: '100000000',
            symbol: 'btc',
        });

        expect(result.current?.toFixed(2)).toBe('12.53');
    });

    it('converts a token balance using the token rate', async () => {
        const tokenAddress = toTokenAddress('0x4d224452801ACEd8B2F0aebE155379bb5D594381');
        setNewStoreMockup({
            currentRates: { [getFiatRateKey('eth', 'usd', tokenAddress)]: createRate(2.503) },
        });
        const { result } = await renderUseFiatFromCryptoValue({
            cryptoValue: '1000000',
            symbol: 'eth',
            tokenAddress,
            tokenDecimals: 6,
        });

        expect(result.current?.toFixed(2)).toBe('2.50');
    });

    it('returns zero fiat for a zero token balance even without a rate', async () => {
        setNewStoreMockup({});
        const { result } = await renderUseFiatFromCryptoValue({
            cryptoValue: '0',
            symbol: 'eth',
            tokenAddress: toTokenAddress('0x4d224452801ACEd8B2F0aebE155379bb5D594381'),
            tokenDecimals: 6,
        });

        expect(result.current?.toFixed(2)).toBe('0.00');
    });

    it('uses the historic rate when requested', async () => {
        setNewStoreMockup({
            currentRates: { [getFiatRateKey('btc', 'usd')]: createRate(12.523) },
        });
        const { result } = await renderUseFiatFromCryptoValue({
            cryptoValue: '1',
            symbol: 'btc',
            isBalance: true,
            useHistoricRate: true,
            historicRate: 20.006,
        });

        expect(result.current?.toFixed(2)).toBe('20.01');
    });

    it('returns null when the rate is missing', async () => {
        setNewStoreMockup({});
        const { result } = await renderUseFiatFromCryptoValue({
            cryptoValue: '1',
            symbol: 'btc',
            isBalance: true,
        });

        expect(result.current).toBeNull();
    });

    it('returns null for a testnet symbol', async () => {
        setNewStoreMockup({
            currentRates: { [getFiatRateKey('test', 'usd')]: createRate(12.523) },
        });
        const { result } = await renderUseFiatFromCryptoValue({
            cryptoValue: '1',
            symbol: 'test',
            isBalance: true,
        });

        expect(result.current).toBeNull();
    });
});
