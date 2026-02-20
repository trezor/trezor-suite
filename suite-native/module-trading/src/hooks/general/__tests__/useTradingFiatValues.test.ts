import type { CryptoId } from 'invity-api';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { Rate, Timestamp, WalletSettings } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import {
    type FullAppState,
    act,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils';
import {
    btcAsset,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { PROTO } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { useTradingFiatValues } from '../useTradingFiatValues';

jest.mock('@suite-common/fiat-services', () => ({
    ...jest.requireActual('@suite-common/fiat-services'),
    fetchCurrentFiatRates: () => Promise.resolve(null),
}));

const createMockRate = (rate: number, symbol: NetworkSymbol): Rate => ({
    rate,
    lastTickerTimestamp: 1000000 as Timestamp,
    lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
    isLoading: false,
    error: null,
    ticker: { symbol },
});

const getPreloadedState = (
    walletOverrides: Partial<FullAppState['wallet']> = {},
): Partial<FullAppState> => ({
    wallet: {
        settings: {
            localCurrency: 'usd',
            bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
        } as WalletSettings,
        fiat: {
            current: {
                [getFiatRateKey('btc', 'usd')]: createMockRate(50000, 'btc'),
                [getFiatRateKey('eth', 'usd', usdcAsset.contractAddress!)]: createMockRate(
                    1,
                    'eth',
                ),
            },
            lastWeek: {},
            historic: {},
        },
        ...walletOverrides,
    } as FullAppState['wallet'],
});

const renderUseTradingFiatValues = async (
    amount: string | undefined,
    cryptoId: CryptoId | undefined,
    preloadedState: Partial<FullAppState> = getPreloadedState(),
) => {
    const res = renderHookWithStoreProvider(() => useTradingFiatValues(amount, cryptoId), {
        preloadedState,
    });

    // await mocked loading of rates
    await act(() => Promise.resolve());

    return res;
};

describe('useTradingFiatValues', () => {
    describe('returns null when required parameters are missing', () => {
        it('should return null when amount is undefined', async () => {
            const { result } = await renderUseTradingFiatValues(undefined, btcAsset.cryptoId);

            expect(result.current).toBeNull();
        });

        it('should return null when cryptoId is undefined', async () => {
            const { result } = await renderUseTradingFiatValues('1', undefined);

            expect(result.current).toBeNull();
        });

        it('should return null when amount is empty', async () => {
            const { result } = await renderUseTradingFiatValues('', btcAsset.cryptoId);

            expect(result.current).toBeNull();
        });
    });

    describe('returns correct values for native tokens', () => {
        it('should calculate fiat value for Bitcoin', async () => {
            const { result } = await renderUseTradingFiatValues('1', btcAsset.cryptoId);

            expect(result.current?.fiatValue).toBe('50000.00');
            expect(result.current?.symbol).toBe('btc');
            expect(result.current?.baseCurrencyAmount).toBeInstanceOf(BigNumber);
            expect(result.current?.baseCurrencyAmount?.toString()).toBe('50000');
        });
    });

    describe('returns correct values for ERC-20 tokens', () => {
        it('should calculate fiat value for USDC token', async () => {
            const { result } = await renderUseTradingFiatValues('100', usdcAsset.cryptoId);

            expect(result.current).not.toBeNull();
            expect(result.current?.fiatValue).toBe('100.00');
            expect(result.current?.symbol).toBe('eth');
            expect(result.current?.tokenAddress).toBe(usdcAsset.contractAddress!);
            expect(result.current?.baseCurrencyAmount).toBeInstanceOf(BigNumber);
            expect(result.current?.baseCurrencyAmount?.toString()).toBe('100');
        });
    });

    describe('handles shouldSendInSats option', () => {
        it('should convert amount to satoshis when bitcoinAmountUnit is SATOSHI', async () => {
            const preloadedState = getPreloadedState({
                settings: {
                    localCurrency: 'usd',
                    bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI,
                } as WalletSettings,
            });

            const { result } = await renderUseTradingFiatValues(
                '1',
                btcAsset.cryptoId,
                preloadedState,
            );

            expect(result.current?.formattedBalance).toBe('100000000');
            expect(result.current?.accountBalance).toBe('1');
        });
    });

    describe('fiatRatesUpdater', () => {
        it('should return fiatRatesUpdater as a function', async () => {
            const { result } = await renderUseTradingFiatValues('1', btcAsset.cryptoId);

            expect(typeof result.current?.fiatRatesUpdater).toBe('function');
        });
    });
});
