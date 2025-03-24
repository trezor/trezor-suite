import { ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Provider } from 'react-redux';

import { EnhancedStore } from '@reduxjs/toolkit';

import { PreloadedState, initStore } from '@suite-native/state';

import { BasicProviderForTests } from './BasicProviderForTests';

type ReduxProviderProps = {
    children: ReactNode;
    preloadedState: Partial<PreloadedState>;
};

export const STORE_WARMING_UP_MSG = 'Store is warming up...';

/*
This file is a copy of `StoreProvider.tsx` from `suite-native/state` but with ability to pass `preloadedState` as a prop
and without the `Persistor` and  `Sentry` logic.
 */
export const StoreProviderForTests = ({ children, preloadedState }: ReduxProviderProps) => {
    const [store, setStore] = useState<EnhancedStore | null>(null);

    useEffect(() => {
        const initStoreAsync = async () => {
            const freshStore = await initStore(preloadedState);
            setStore(freshStore);
        };

        initStoreAsync();
    }, [preloadedState]);

    if (store === null) {
        return <View accessibilityLabel={STORE_WARMING_UP_MSG} />;
    }

    return (
        <Provider store={store}>
            <BasicProviderForTests>{children}</BasicProviderForTests>
        </Provider>
    );
};
