import { type Reducer, configureStore } from '@reduxjs/toolkit';

import { mergeDeepObject } from '@trezor/utils';

import { createStaticReducer } from './createStaticReducer';

/**
 * Creates a Redux store with identity reducers inferred from the shape of
 * `preloadedState`. Each leaf value becomes the initial state of a no-op
 * reducer that ignores every action and always returns its initial state.
 *
 * This is useful for tests that only *read* from the store (most render
 * and hook tests). Tests that *dispatch* actions that should mutate state
 * must use `createLightStore` with real reducers instead.
 */
export const createStoreFromPreloadedState = (preloadedState: Record<string, unknown> = {}) => {
    const defaultState: Record<string, unknown> = {
        wallet: { settings: { localCurrency: 'usd', bitcoinAmountUnit: 0 } },
        locale: { systemLocaleCode: 'en', appLocaleCode: 'system' },
    };

    const merged = mergeDeepObject(defaultState, preloadedState);

    const reducer: Record<string, Reducer> = {};

    for (const [key, value] of Object.entries(merged)) {
        reducer[key] = createStaticReducer(value);
    }

    return configureStore({
        reducer,
        preloadedState: merged,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
    });
};
