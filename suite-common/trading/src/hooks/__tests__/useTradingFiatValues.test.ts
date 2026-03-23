import { type CryptoId } from 'invity-api';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type Rate, type Timestamp } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import {
    type TradingTestStateWithWalletSettings,
    createTestStateWithWalletSettings,
    renderHookWithTradingStore,
} from '../../__tests__/testUtils';
import {
    type TradingFiatRatesProps,
    type TradingFiatRatesReturn,
    useTradingFiatValues,
} from '../useTradingFiatValues';

// Mock crypto IDs for testing
const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;
const ETHEREUM_CRYPTO_ID = 'ethereum' as CryptoId;

const createMockRate = (rate: number, symbol: NetworkSymbol = 'btc'): Rate => ({
    rate,
    lastTickerTimestamp: 1000000 as Timestamp,
    lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
    isLoading: false,
    error: null,
    ticker: {
        symbol,
    },
});

const getPreloadedState = () => {
    const btcRate = createMockRate(50000);
    const fiatRateKey = getFiatRateKey('btc', 'usd');

    return createTestStateWithWalletSettings({
        fiat: {
            current: {
                [fiatRateKey]: btcRate,
            },
            lastWeek: {},
            historic: {},
        },
    });
};

const renderUseTradingFiatValues = (
    props: TradingFiatRatesProps,
    preloadedState: TradingTestStateWithWalletSettings = createTestStateWithWalletSettings(),
) => renderHookWithTradingStore(() => useTradingFiatValues(props), { preloadedState });

describe('useTradingFiatValues', () => {
    describe('returns null when required parameters are missing', () => {
        it('should return null when cryptoId is undefined', () => {
            const { result } = renderUseTradingFiatValues({
                cryptoId: undefined,
                fiatCurrency: 'usd',
                amount: '100',
            });

            expect(result.current).toBeNull();
        });

        it('should return null when fiatCurrency is undefined', () => {
            const { result } = renderUseTradingFiatValues({
                cryptoId: BITCOIN_CRYPTO_ID,
                fiatCurrency: undefined,
                amount: '100',
            });

            expect(result.current).toBeNull();
        });

        it('should return null when amount is undefined', () => {
            const { result } = renderUseTradingFiatValues({
                cryptoId: BITCOIN_CRYPTO_ID,
                fiatCurrency: 'usd',
                amount: undefined,
            });

            expect(result.current).toBeNull();
        });

        it('should return null when all parameters are missing', () => {
            const { result } = renderUseTradingFiatValues({});

            expect(result.current).toBeNull();
        });
    });

    describe('returns correct values for native tokens', () => {
        it('should calculate fiat value for Bitcoin', () => {
            const preloadedState = getPreloadedState();

            const { result } = renderUseTradingFiatValues(
                {
                    cryptoId: BITCOIN_CRYPTO_ID,
                    fiatCurrency: 'usd',
                    amount: '1',
                },
                preloadedState,
            );

            expect(result.current).not.toBeNull();
            expect(result.current?.fiatValue).toBe('50000.00');
            expect(result.current?.symbol).toBe('btc');
            expect(result.current?.accountBalance).toBe('1');
            expect(result.current?.tokenAddress).toBeUndefined();
        });

        it('should calculate fiat value for Ethereum', () => {
            const ethRate = createMockRate(3000, 'eth');
            const fiatRateKey = getFiatRateKey('eth', 'eur');

            const preloadedState = createTestStateWithWalletSettings({
                settings: {
                    ...initialWalletSettingsState,
                    localCurrency: 'eur',
                },
                fiat: {
                    current: {
                        [fiatRateKey]: ethRate,
                    },
                    lastWeek: {},
                    historic: {},
                },
            });

            const { result } = renderUseTradingFiatValues(
                {
                    cryptoId: ETHEREUM_CRYPTO_ID,
                    fiatCurrency: 'eur',
                    amount: '2.5',
                },
                preloadedState,
            );

            expect(result.current).not.toBeNull();
            expect(result.current?.fiatValue).toBe('7500.00');
            expect(result.current?.symbol).toBe('eth');
            expect(result.current?.tokenAddress).toBeUndefined();
        });

        it('should return correct network decimals for Bitcoin', () => {
            const preloadedState = getPreloadedState();

            const { result } = renderUseTradingFiatValues(
                {
                    cryptoId: BITCOIN_CRYPTO_ID,
                    fiatCurrency: 'usd',
                    amount: '1',
                },
                preloadedState,
            );

            expect(result.current?.networkDecimals).toBe(8);
        });
    });

    describe('handles fiat rate unavailability', () => {
        it('should return null fiatValue when rate is not available', () => {
            const preloadedState = createTestStateWithWalletSettings({
                fiat: {
                    current: {},
                    lastWeek: {},
                    historic: {},
                },
            });

            const { result } = renderUseTradingFiatValues(
                {
                    cryptoId: BITCOIN_CRYPTO_ID,
                    fiatCurrency: 'usd',
                    amount: '1',
                },
                preloadedState,
            );

            expect(result.current).not.toBeNull();
            expect(result.current?.fiatValue).toBeNull();
            expect(result.current?.fiatRate).toBeUndefined();
        });
    });

    describe('handles shouldSendInSats option', () => {
        it('should convert amount to satoshis when shouldSendInSats is true', () => {
            const preloadedState = getPreloadedState();

            const { result } = renderUseTradingFiatValues(
                {
                    cryptoId: BITCOIN_CRYPTO_ID,
                    fiatCurrency: 'usd',
                    amount: '1',
                    shouldSendInSats: true,
                },
                preloadedState,
            );

            expect(result.current).not.toBeNull();
            // 1 BTC = 100,000,000 satoshis
            expect(result.current?.formattedBalance).toBe('100000000');
            expect(result.current?.accountBalance).toBe('1');
        });

        it('should not convert amount when shouldSendInSats is false', () => {
            const preloadedState = getPreloadedState();

            const { result } = renderUseTradingFiatValues(
                {
                    cryptoId: BITCOIN_CRYPTO_ID,
                    fiatCurrency: 'usd',
                    amount: '1',
                    shouldSendInSats: false,
                },
                preloadedState,
            );

            expect(result.current).not.toBeNull();
            expect(result.current?.formattedBalance).toBe('1');
            expect(result.current?.accountBalance).toBe('1');
        });
    });

    describe('fiatRatesUpdater function', () => {
        it('should return fiatRatesUpdater function', () => {
            const preloadedState = getPreloadedState();

            const { result } = renderUseTradingFiatValues(
                {
                    cryptoId: BITCOIN_CRYPTO_ID,
                    fiatCurrency: 'usd',
                    amount: '1',
                },
                preloadedState,
            );

            expect(result.current).not.toBeNull();
            expect(typeof result.current?.fiatRatesUpdater).toBe('function');
        });

        it('should return null when fiatRatesUpdater is called with undefined value', async () => {
            const preloadedState = getPreloadedState();

            const { result } = renderUseTradingFiatValues(
                {
                    cryptoId: BITCOIN_CRYPTO_ID,
                    fiatCurrency: 'usd',
                    amount: '1',
                },
                preloadedState,
            );

            const updaterResult = await result.current?.fiatRatesUpdater(undefined);
            expect(updaterResult).toBeNull();
        });
    });

    describe('return value structure', () => {
        it('should return all expected properties', () => {
            const preloadedState = getPreloadedState();

            const { result } = renderUseTradingFiatValues(
                {
                    cryptoId: BITCOIN_CRYPTO_ID,
                    fiatCurrency: 'usd',
                    amount: '1',
                },
                preloadedState,
            );

            const returnValue = result.current as TradingFiatRatesReturn;
            expect(returnValue).toHaveProperty('fiatValue');
            expect(returnValue).toHaveProperty('fiatRate');
            expect(returnValue).toHaveProperty('accountBalance');
            expect(returnValue).toHaveProperty('formattedBalance');
            expect(returnValue).toHaveProperty('symbol');
            expect(returnValue).toHaveProperty('networkDecimals');
            expect(returnValue).toHaveProperty('tokenAddress');
            expect(returnValue).toHaveProperty('fiatRatesUpdater');
        });
    });
});
