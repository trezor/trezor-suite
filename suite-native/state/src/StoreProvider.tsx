import { useEffect, useState, ReactNode } from 'react';
import { Provider } from 'react-redux';

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
            const freshStore = await initStore();
            const freshPersistor = persistStore(freshStore);
            setStore(freshStore);
            setStorePersistor(freshPersistor);
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
