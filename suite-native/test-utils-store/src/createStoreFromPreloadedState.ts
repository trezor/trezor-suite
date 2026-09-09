import { configureStore } from '@reduxjs/toolkit';

import { mergeDeepObject } from '@trezor/utils';

import { createStaticReducer } from './createStaticReducer';

/**
 * Creates a Redux store whose state is inferred from `preloadedState` and the
 * default provider state. Its no-op reducer preserves that state on every action.
 *
 * This is useful for tests that only *read* from the store (most render
 * and hook tests). Tests that *dispatch* actions that should mutate state
 * must use `createLightStore` with real reducers instead.
 */
export const createStoreFromPreloadedState = <TState extends object = object>(
    preloadedState?: TState,
) => {
    const defaultState = {
        discreetMode: { isActive: false },
        wallet: {
            settings: { localCurrency: 'usd', bitcoinAmountUnit: 0, addressDisplayType: 'chunked' },
        },
        locale: { systemLocaleCode: 'en', appLocaleCode: 'system' },
    };

    // Preserve discriminated unions from the input; mergeDeepObject otherwise merges their variants.
    const merged = mergeDeepObject(defaultState, preloadedState ?? {}) as TState &
        typeof defaultState;

    return configureStore<typeof merged>({
        reducer: createStaticReducer(merged),
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
    });
};
