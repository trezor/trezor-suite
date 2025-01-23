import { ReactNode, useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import { EnhancedStore } from '@reduxjs/toolkit';

import { initStore, PreloadedState } from '@suite-native/state';

import { BasicProvider } from './BasicProvider';

type ReduxProviderProps = {
    children: ReactNode;
    preloadedState: PreloadedState;
};

/*
This is file is a copy of `StoreProvider.tsx` from `suite-native/state` but with ability to pass `preloadedState` as a prop
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

    if (store === null) return null;

    return (
        <Provider store={store}>
            <BasicProvider>{children}</BasicProvider>
        </Provider>
    );
};
