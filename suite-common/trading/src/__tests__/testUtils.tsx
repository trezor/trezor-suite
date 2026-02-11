import { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { combineReducers } from '@reduxjs/toolkit';
import { RenderHookOptions, renderHook } from '@testing-library/react';
import type { BuyProviderInfo, ExchangeProviderInfo, SellProviderInfo } from 'invity-api';

import { configureMockStore } from '@suite-common/test-utils';

import type { BuyInfo } from '../reducers/buyReducer';
import type { ExchangeInfo } from '../reducers/exchangeReducer';
import type { SellInfo } from '../reducers/sellReducer';
import { TradingState, initialState, tradingCommonReducer } from '../reducers/tradingCommonReducer';
import { regional } from '../regional';

export type TradingTestState = {
    wallet: {
        trading: TradingState;
    };
};

type RenderHookWithTradingStoreOptions<Props> = RenderHookOptions<Props> & {
    preloadedState?: Partial<TradingTestState>;
};

/**
 * Creates a trading test state with proper structure.
 *
 * @param overrides - Partial TradingState to merge with initialState
 * @returns Complete TradingTestState ready for Redux store
 *
 * @example
 * ```ts
 * const state = createTradingTestState({
 *   currentProviderMetadata: mockProvider,
 *   buy: { ...initialState.buy, isLoading: true }
 * });
 * ```
 */
export const createTradingTestState = (
    overrides: Partial<TradingState> = {},
): TradingTestState => ({
    wallet: {
        trading: {
            ...initialState,
            ...overrides,
        },
    },
});

/**
 * Creates a partial BuyInfo state for testing.
 *
 * @param providerInfos - Map of provider name to BuyProviderInfo
 * @returns Partial BuyInfo with minimal required fields
 *
 * @example
 * ```ts
 * const buyInfo = createBuyInfoState({
 *   changenow: getProviderMetadataFixture('changenow') as BuyProviderInfo
 * });
 * ```
 */
export const createBuyInfoState = (
    providerInfos: Record<string, BuyProviderInfo> = {},
): Partial<BuyInfo> => ({
    buyInfo: {
        country: regional.UNKNOWN_COUNTRY,
        providers: [],
        defaultAmountsOfFiatCurrencies: {} as any,
    },
    providerInfos,
    supportedCryptoCurrencies: [],
    supportedFiatCurrencies: [],
});

/**
 * Creates a partial ExchangeInfo state for testing.
 *
 * @param providerInfos - Map of provider name to ExchangeProviderInfo
 * @returns Partial ExchangeInfo with minimal required fields
 */
export const createExchangeInfoState = (
    providerInfos: Record<string, ExchangeProviderInfo> = {},
): Partial<ExchangeInfo> => ({
    providerInfos,
    buyCryptoIds: [],
    sellCryptoIds: [],
});

/**
 * Creates a partial SellInfo state for testing.
 *
 * @param providerInfos - Map of provider name to SellProviderInfo
 * @returns Partial SellInfo with minimal required fields
 */
export const createSellInfoState = (
    providerInfos: Record<string, SellProviderInfo> = {},
): Partial<SellInfo> => ({
    country: regional.UNKNOWN_COUNTRY,
    providerInfos,
    supportedCryptoCurrencies: [],
    supportedFiatCurrencies: [],
});

/**
 * Renders a hook with pre-configured trading Redux store.
 *
 * This utility automatically creates a Redux store with the trading reducer
 * and wraps the hook in a Provider. It returns the standard React Testing Library
 * hook result plus the store instance for state assertions.
 *
 * @template Result - Return type of the hook
 * @template Props - Props type for the hook (for rerendering)
 * @param callback - Hook function to test
 * @param options - Rendering options
 * @param options.preloadedState - Initial Redux state for the store
 * @param options.initialProps - Initial props to pass to the hook
 * @returns Hook result with additional `store` property
 *
 * @example
 * ```ts
 * // Simple usage
 * const { result } = renderHookWithTradingStore(
 *   () => useMyHook('buy')
 * );
 *
 * // With preloaded state
 * const { result, store } = renderHookWithTradingStore(
 *   () => useProviderMetadataChangeEffect('buy', 'changenow', true),
 *   {
 *     preloadedState: createTradingTestState({
 *       buy: {
 *         ...initialState.buy,
 *         buyInfo: createBuyInfoState({
 *           changenow: mockProvider as BuyProviderInfo
 *         })
 *       }
 *     })
 *   }
 * );
 *
 * // With props for rerendering
 * const { result, rerender } = renderHookWithTradingStore<
 *   ReturnType<typeof useMyHook>,
 *   { provider: string }
 * >(
 *   ({ provider }) => useMyHook(provider),
 *   { initialProps: { provider: 'changenow' } }
 * );
 *
 * rerender({ provider: 'sideshift' });
 * ```
 */
export const renderHookWithTradingStore = <Result, Props = unknown>(
    callback: (props: Props) => Result,
    { preloadedState, ...options }: RenderHookWithTradingStoreOptions<Props> = {},
) => {
    const store = configureMockStore({
        reducer: combineReducers({
            wallet: combineReducers({
                trading: tradingCommonReducer,
            }),
        }),
        preloadedState: preloadedState || createTradingTestState(),
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider store={store}>{children}</Provider>
    );

    return {
        ...renderHook(callback, { wrapper, ...options }),
        store,
    };
};
