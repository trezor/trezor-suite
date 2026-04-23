import { type ReactNode, useMemo } from 'react';
import { Provider } from 'react-redux';

import type { EnhancedStore } from '@reduxjs/toolkit';

import { useFormattersConfig } from '@suite-native/formatters-config';
import { ALL_PROVIDERS, ProviderForTests, type ProviderKey } from '@suite-native/test-utils';

import { createStoreFromPreloadedState } from './createStoreFromPreloadedState';

export type TestStore = EnhancedStore;

type ReduxProviderProps = {
    children: ReactNode;
    preloadedState?: Record<string, unknown>;
    injectedStore?: TestStore;
    providers?: ProviderKey[];
};

const ProviderForTestsWithFormattingConfig = ({
    children,
    providers,
}: {
    children: ReactNode;
    providers?: ProviderKey[];
}) => {
    const formattersConfig = useFormattersConfig();

    return (
        <ProviderForTests providers={providers} formattersConfig={formattersConfig}>
            {children}
        </ProviderForTests>
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
    providers = ALL_PROVIDERS,
}: ReduxProviderProps) => {
    const store = useMemo(() => {
        if (injectedStore) {
            return injectedStore;
        }

        return createStoreFromPreloadedState(preloadedState);
    }, [injectedStore, preloadedState]);

    return (
        <Provider store={store}>
            <ProviderForTestsWithFormattingConfig providers={providers}>
                {children}
            </ProviderForTestsWithFormattingConfig>
        </Provider>
    );
};
