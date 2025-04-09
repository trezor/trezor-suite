import { ReactNode, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Provider } from 'react-redux';

import { EnhancedStore } from '@reduxjs/toolkit';
import { Persistor, persistStore } from 'redux-persist';

import { captureSentryException } from '@suite-native/sentry';
import { StorageProvider } from '@suite-native/storage';

import { initStore } from './store';

type StoreProviderProps = {
    children: ReactNode;
};

export const StoreProvider = ({ children }: StoreProviderProps) => {
    const initStoreCalledRef = useRef(false);
    const [store, setStore] = useState<EnhancedStore | null>(null);
    const [storePersistor, setStorePersistor] = useState<Persistor | null>(null);

    const initStoreAsync = async () => {
        initStoreCalledRef.current = true;
        try {
            const freshStore = await initStore();
            const freshPersistor = persistStore(freshStore);
            setStore(freshStore);
            setStorePersistor(freshPersistor);
        } catch (error) {
            console.error('Init store error:', error);
            captureSentryException(error);
        }
    };
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
    }, []);

    if (store === null || storePersistor === null) return null;

    return (
        <Provider store={store}>
            <StorageProvider persistor={storePersistor}>{children}</StorageProvider>
        </Provider>
    );
};
