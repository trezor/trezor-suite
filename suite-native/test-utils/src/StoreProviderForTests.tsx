import { type ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Provider } from 'react-redux';

import { useFormattersConfig } from '@suite-native/formatters-config';
import { PreloadedState, Store, initStore } from '@suite-native/state';

import { BasicProviderForTests } from './BasicProviderForTests';

export type TestStore = Store;

type ReduxProviderProps = {
    children: ReactNode;
    preloadedState: PreloadedState;
    injectedStore?: TestStore;
};

export const STORE_WARMING_UP_MSG = 'Store is warming up...';

const BasicProviderWithFormattingConfig = ({ children }: { children: ReactNode }) => {
    const formattersConfig = useFormattersConfig();

    return (
        <BasicProviderForTests formattersConfig={formattersConfig}>
            {children}
        </BasicProviderForTests>
    );
};

/*
This file is a copy of `StoreProvider.tsx` from `suite-native/state` but with ability
to pass `preloadedState` of `injectedStore` as a prop and without the `Persistor` and  `Sentry` logic.
 */
export const StoreProviderForTests = ({
    children,
    injectedStore,
    preloadedState,
}: ReduxProviderProps) => {
    const [store, setStore] = useState<TestStore | null>(null);

    useEffect(() => {
        if (injectedStore) {
            setStore(injectedStore);

            return;
        }

        const initStoreAsync = () => {
            const { store: freshStore } = initStore(preloadedState);
            setStore(freshStore);
        };

        initStoreAsync();
    }, [injectedStore, preloadedState]);

    if (store === null) {
        return <View accessibilityLabel={STORE_WARMING_UP_MSG} />;
    }

    return (
        <Provider store={store}>
            <BasicProviderWithFormattingConfig>{children}</BasicProviderWithFormattingConfig>
        </Provider>
    );
};
