import { combineReducers } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';

import { useIsNetworkReserveBannerVisible } from './useIsNetworkReserveBannerVisible';

const solSymbol = asNetworkSymbol('sol');
const btcSymbol = asNetworkSymbol('btc');
const baseSymbol = asNetworkSymbol('base');

// SOL nativeTokenReserve: "0.003"; base: "0.0002"
describe('useIsNetworkReserveBannerVisible', () => {
    let store: TestStore;

    beforeEach(() => {
        store = createLightStore({
            reducer: {
                locale: localeReducer,
                wallet: combineReducers({
                    settings: createStaticReducer({
                        ...initialWalletSettingsState,
                        networkReserve: true,
                    }),
                }),
            },
        });
    });

    const renderHook = async (params: Parameters<typeof useIsNetworkReserveBannerVisible>[0]) =>
        await renderHookWithStoreProvider(() => useIsNetworkReserveBannerVisible(params), {
            store,
        });

    it('returns false for null symbol, null amount, null balance, or no-reserve network', async () => {
        expect(
            (await renderHook({ symbol: undefined, amount: '1', balance: '2' })).result.current,
        ).toBe(false);
        expect(
            (await renderHook({ symbol: solSymbol, amount: null, balance: '1' })).result.current,
        ).toBe(false);
        expect(
            (await renderHook({ symbol: solSymbol, amount: '1', balance: null })).result.current,
        ).toBe(false);
        expect(
            (await renderHook({ symbol: btcSymbol, amount: '0.5', balance: '1' })).result.current,
        ).toBe(false);
    });

    it('returns false for tokens (contractAddress set)', async () => {
        expect(
            (
                await renderHook({
                    symbol: solSymbol,
                    contractAddress: 'some-token-contract',
                    amount: '0.998',
                    balance: '1.0',
                })
            ).result.current,
        ).toBe(false);
    });

    it('shows banner when remainder is at or below static network reserve (no maxAmount)', async () => {
        // remainder = 1.0 - 0.997 = 0.003 = SOL reserve
        expect(
            (await renderHook({ symbol: solSymbol, amount: '0.997', balance: '1.0' })).result
                .current,
        ).toBe(true);
        // remainder = 1.0 - 0.998 = 0.002 < 0.003
        expect(
            (await renderHook({ symbol: solSymbol, amount: '0.998', balance: '1.0' })).result
                .current,
        ).toBe(true);
    });

    it('hides banner when amount is below reserve zone', async () => {
        expect(
            (await renderHook({ symbol: solSymbol, amount: '0.5', balance: '1.0' })).result.current,
        ).toBe(false);
    });

    it('hides banner when amount exceeds balance', async () => {
        expect(
            (await renderHook({ symbol: solSymbol, amount: '1.1', balance: '1.0' })).result.current,
        ).toBe(false);
    });

    it('hides banner for zero amount', async () => {
        expect(
            (await renderHook({ symbol: solSymbol, amount: '0', balance: '1.0' })).result.current,
        ).toBe(false);
    });

    it('shows banner when amount equals composed maxAmount (send / fee path)', async () => {
        // feeWithReserve = balance - maxAmount = 0.01; remainder = 0.01
        expect(
            (
                await renderHook({
                    symbol: solSymbol,
                    amount: '0.99',
                    balance: '1.0',
                    maxAmount: '0.99',
                })
            ).result.current,
        ).toBe(true);
    });

    it('hides banner when below composed maxAmount threshold', async () => {
        expect(
            (
                await renderHook({
                    symbol: solSymbol,
                    amount: '0.5',
                    balance: '1.0',
                    maxAmount: '0.99',
                })
            ).result.current,
        ).toBe(false);
    });

    it('shows banner on base network at reserve boundary', async () => {
        // remainder = 0.1 - 0.0999 = 0.0001 <= base reserve 0.0002
        expect(
            (await renderHook({ symbol: baseSymbol, amount: '0.0999', balance: '0.1' })).result
                .current,
        ).toBe(true);
    });
});
