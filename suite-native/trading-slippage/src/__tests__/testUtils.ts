import type { ReactElement } from 'react';

import { localeInitialState } from '@suite-native/intl';
import {
    type createLightStore,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { getInitializedTradingState } from '@suite-native/trading-fixtures';

const getSlippageTestPreloadedState = () => ({
    locale: localeInitialState,
    wallet: { trading: getInitializedTradingState() },
});

export const renderWithSlippageTestProvider = (
    element: ReactElement,
    store?: ReturnType<typeof createLightStore>,
) => {
    const preloadedState = store ? undefined : getSlippageTestPreloadedState();

    return renderWithStoreProvider(element, { preloadedState, store });
};

export const renderHookWithSlippageTestProvider = <Result>(
    callback: () => Result,
    store?: ReturnType<typeof createLightStore>,
) => {
    const preloadedState = store ? undefined : getSlippageTestPreloadedState();

    return renderHookWithStoreProvider(callback, { preloadedState, store });
};
