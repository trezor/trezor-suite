import { type ReactNode, useMemo } from 'react';
import { Provider } from 'react-redux';

import type { EnhancedStore } from '@reduxjs/toolkit';

import { useFormattersConfig } from '@suite-native/formatters-config';
import { BasicProviderForTests } from '@suite-native/test-utils';

import { createStoreFromPreloadedState } from './createStoreFromPreloadedState';

export type TestStore = EnhancedStore;

type ReduxProviderProps = {
    children: ReactNode;
    preloadedState?: Record<string, unknown>;
    injectedStore?: TestStore;
};

const BasicProviderWithFormattingConfig = ({ children }: { children: ReactNode }) => {
    const formattersConfig = useFormattersConfig();

    return (
        <BasicProviderForTests formattersConfig={formattersConfig}>
            {children}
        </BasicProviderForTests>
    );
};

/*
Simplified synchronous (= no async warming up) version of `StoreProvider.tsx` from `suite-native/state` but without async logic
for persisted state or Sentry. Allows to specify `preloadedState` of store or even inject precomposed
store with `injectedStore`.
 */
export const StoreProviderForTests = ({
    children,
    injectedStore,
    preloadedState,
}: ReduxProviderProps) => {
    const store = useMemo(() => {
        if (injectedStore) {
            return injectedStore;
        }

        return createStoreFromPreloadedState(preloadedState);
    }, [injectedStore, preloadedState]);

    return (
        <Provider store={store}>
            <BasicProviderWithFormattingConfig>{children}</BasicProviderWithFormattingConfig>
        </Provider>
    );
};
