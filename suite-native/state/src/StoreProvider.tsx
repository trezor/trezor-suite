import { useEffect, useState, ReactNode } from 'react';
import { Provider } from 'react-redux';

import * as Sentry from '@sentry/react-native';
import { EnhancedStore } from '@reduxjs/toolkit';
import { Persistor, persistStore } from 'redux-persist';

import { StorageProvider } from '@suite-native/storage';

import { initStore } from './store';

type StoreProviderProps = {
    children: ReactNode;
};

export const StoreProvider = ({ children }: StoreProviderProps) => {
    const [store, setStore] = useState<EnhancedStore | null>(null);
    const [storePersistor, setStorePersistor] = useState<Persistor | null>(null);

    useEffect(() => {
        const initStoreAsync = async () => {
            try {
                const freshStore = await initStore();
                const freshPersistor = persistStore(freshStore);
                setStore(freshStore);
                setStorePersistor(freshPersistor);
            } catch (error) {
                console.error('Init store error:', error);
                Sentry.captureException(error);
            }
        };

        initStoreAsync();
    }, []);

    if (store === null || storePersistor === null) return null;

    return (
        <Provider store={store}>
            <StorageProvider persistor={storePersistor}>{children}</StorageProvider>
        </Provider>
    );
};
