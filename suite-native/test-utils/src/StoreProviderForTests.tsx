import { ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Provider } from 'react-redux';

import { EnhancedStore } from '@reduxjs/toolkit';

import { useFormattersConfig } from '@suite-native/formatters';
import { PreloadedState, initStore } from '@suite-native/state';

import { BasicProviderForTests } from './BasicProviderForTests';

export type TestStore = Awaited<ReturnType<typeof initStore>>;

type ReduxProviderProps = {
    children: ReactNode;
    preloadedState: Partial<PreloadedState>;
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
    const [store, setStore] = useState<EnhancedStore | null>(null);

    useEffect(() => {
        if (injectedStore) {
            setStore(injectedStore);

            return;
        }

        const initStoreAsync = async () => {
            const freshStore = await initStore(preloadedState);
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
