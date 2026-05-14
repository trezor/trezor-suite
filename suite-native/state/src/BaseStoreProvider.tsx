import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Provider } from 'react-redux';

import { type Persistor, persistStore } from 'redux-persist';

import { captureSentryException } from '@suite-native/sentry';
import { NativeServicesProvider } from '@suite-native/services';
import { StorageProvider } from '@suite-native/storage';

import { type PreloadedState, type StoreWithExtra, initStore } from './store';

export type BaseStoreProviderProps = {
    children: ReactNode;
    preloadedState?: PreloadedState;
};

export const BaseStoreProvider = ({ children, preloadedState }: BaseStoreProviderProps) => {
    const initStoreCalledRef = useRef(false);
    const [store, setStore] = useState<StoreWithExtra | null>(null);
    const [storePersistor, setStorePersistor] = useState<Persistor | null>(null);

    const initStoreAsync = useCallback(() => {
        initStoreCalledRef.current = true;
        try {
            const freshStore = initStore(preloadedState);
            const freshPersistor = persistStore(freshStore.store);
            setStore(freshStore);
            setStorePersistor(freshPersistor);
        } catch (error) {
            console.error('Init store error:', error);
            captureSentryException(error);
        }
    }, [preloadedState]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (!initStoreCalledRef.current && nextAppState === 'active') {
                initStoreAsync();
            }
        });

        if (!initStoreCalledRef.current && AppState.currentState === 'active') {
            initStoreAsync();
            subscription.remove();
        }

        return () => {
            subscription.remove();
        };
    }, [initStoreAsync]);

    if (store === null || storePersistor === null) return null;

    return (
        <NativeServicesProvider services={store.services}>
            <Provider store={store.store}>
                <StorageProvider persistor={storePersistor}>{children}</StorageProvider>
            </Provider>
        </NativeServicesProvider>
    );
};
