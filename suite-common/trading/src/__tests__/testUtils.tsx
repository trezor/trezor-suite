import { combineReducers } from '@reduxjs/toolkit';

import {
    type RenderHookOptions,
    configureMockStore,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import {
    type FiatRatesState,
    type WalletSettingsState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';

import {
    type TradingState,
    initialState,
    tradingCommonReducer,
} from '../reducers/tradingCommonReducer';
import { regional } from '../regional';

/**
 * TODO This utility is a temporary solution to simplify testing of trading-related hooks and components.
 * Is should be moved to the correct place defined in the issue below.
 * @see https://github.com/trezor/trezor-suite/issues/25138
 */

export type TradingTestState = {
    wallet: {
        trading: TradingState;
    };
};

export type TradingTestStateWithWalletSettings = {
    wallet: {
        trading: TradingState;
        settings: WalletSettingsState;
        fiat: FiatRatesState;
    };
};

type RenderHookWithTradingStoreOptions<Props> = RenderHookOptions<Props> & {
    preloadedState?: Partial<TradingTestStateWithWalletSettings> | Partial<TradingTestState>;
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

export const createTestStateWithWalletSettings = (
    overrides: Partial<TradingTestStateWithWalletSettings['wallet']> = {},
): TradingTestStateWithWalletSettings => ({
    wallet: {
        trading: initialState,
        settings: initialWalletSettingsState,
        fiat: {
            current: {},
            lastWeek: {},
            historic: {},
        },
        ...overrides,
    },
});

/**
 * Creates a partial BuyInfo state for testing.
 *
 * @param providerInfos - Map of provider name to BuyProviderInfo (or Partial for testing)
 * @returns BuyInfo-like object for testing (with any type for flexibility)
 *
 * @example
 * ```ts
 * const buyInfo = createBuyInfoState({
 *   changenow: getProviderMetadataFixture('changenow') as any
 * });
 * ```
 */
export const createBuyInfoState = (providerInfos: Record<string, any> = {}): any => ({
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
 * @param providerInfos - Map of provider name to ExchangeProviderInfo (or Partial for testing)
 * @returns ExchangeInfo-like object for testing (with any type for flexibility)
 */
export const createExchangeInfoState = (providerInfos: Record<string, any> = {}): any => ({
    providerInfos,
    buyCryptoIds: [],
    sellCryptoIds: [],
});

/**
 * Creates a partial SellInfo state for testing.
 *
 * @param providerInfos - Map of provider name to SellProviderInfo (or Partial for testing)
 * @returns SellInfo-like object for testing (with any type for flexibility)
 */
export const createSellInfoState = (providerInfos: Record<string, any> = {}): any => ({
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
                settings: (state = { localCurrency: 'usd' }) => state,
                fiat: (
                    state = {
                        current: {},
                        lastWeek: {},
                        historic: {},
                    },
                ) => state,
            }),
        }),
        preloadedState: preloadedState || createTradingTestState(),
    });

    return {
        ...renderHookWithStoreProvider(callback, { store, ...options }),
        store,
    };
};
