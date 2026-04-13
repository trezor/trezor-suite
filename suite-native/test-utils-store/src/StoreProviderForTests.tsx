import { type ReactNode, useMemo } from 'react';
import { Provider } from 'react-redux';

import { useFormattersConfig } from '@suite-native/formatters-config';
import type { PreloadedState, Store } from '@suite-native/state';
import { BasicProviderForTests } from '@suite-native/test-utils';

import { initStore } from './initStore';

export type TestStore = Store;

type ReduxProviderProps = {
    children: ReactNode;
    preloadedState: PreloadedState;
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

        const { store: freshStore } = initStore(preloadedState);

        return freshStore;
    }, [injectedStore, preloadedState]);

    return (
        <Provider store={store}>
            <BasicProviderWithFormattingConfig>{children}</BasicProviderWithFormattingConfig>
        </Provider>
    );
};
