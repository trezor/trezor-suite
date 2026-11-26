import { type UnknownAction, createAction } from '@reduxjs/toolkit';
import { act } from '@testing-library/react';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    type WalletSettingsRootState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import { type CurrentRate, asTimestamp } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import { useFiatFromCryptoValue } from './useFiatFromCryptoValue';

type State = FiatRatesRootState & WalletSettingsRootState;

const symbol = asNetworkSymbol('btc');
const fiatRateKey = getFiatRateKey(symbol, 'usd');

const setCurrentRate = createAction<Partial<CurrentRate>>('test/setCurrentRate');

const initialRate: CurrentRate = {
    rate: 100,
    usdRate: 100,
    lastTickerTimestamp: asTimestamp(1),
    lastSuccessfulFetchTimestamp: asTimestamp(1),
    isLoading: false,
    error: null,
    ticker: { symbol },
};

const preloadedState: State = {
    wallet: {
        settings: initialWalletSettingsState,
        fiat: { current: { [fiatRateKey]: initialRate }, lastWeek: {}, historic: {} },
    },
};

const reducer = (state: State = preloadedState, action: UnknownAction): State => {
    if (!setCurrentRate.match(action)) return state;

    const { fiat } = state.wallet;
    const current = { ...fiat.current[fiatRateKey], ...action.payload } as CurrentRate;

    return {
        wallet: {
            ...state.wallet,
            fiat: { ...fiat, current: { ...fiat.current, [fiatRateKey]: current } },
        },
    };
};

const renderFiatHook = () => {
    const { services } = createTestCompositionRoot<void, State>({ reducer, preloadedState });
    let renderCount = 0;
    const hook = renderHookWithStoreProvider(
        () => {
            renderCount++;

            return useFiatFromCryptoValue({ amount: '2', symbol });
        },
        { services },
    );

    return { ...hook, store: services.store, getRenderCount: () => renderCount };
};

describe('useFiatFromCryptoValue', () => {
    it('converts the amount with the current rate', () => {
        const { result } = renderFiatHook();

        expect(result.current.rate).toBe(100);
        expect(result.current.fiatAmount?.toString()).toBe('200');
    });

    it('does not re-render when a fetch leaves the price unchanged', () => {
        const { store, getRenderCount } = renderFiatHook();
        const renderCountBefore = getRenderCount();

        act(() => {
            store.dispatch(setCurrentRate({ isLoading: true }));
        });
        act(() => {
            store.dispatch(
                setCurrentRate({
                    isLoading: false,
                    lastTickerTimestamp: asTimestamp(2),
                    lastSuccessfulFetchTimestamp: asTimestamp(2),
                }),
            );
        });

        expect(getRenderCount()).toBe(renderCountBefore);
    });

    it('re-renders when the price changes', () => {
        const { result, store, getRenderCount } = renderFiatHook();
        const renderCountBefore = getRenderCount();

        act(() => {
            store.dispatch(setCurrentRate({ rate: 110, usdRate: 110 }));
        });

        expect(getRenderCount()).toBe(renderCountBefore + 1);
        expect(result.current.fiatAmount?.toString()).toBe('220');
    });
});
