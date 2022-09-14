import React from 'react';

import { Persistor } from 'redux-persist/es/types';
import { PersistGate } from 'redux-persist/integration/react';

import { StorageContext } from '@suite-native/storage';

type StorageProviderProps = {
    persistor: Persistor;
    children: React.ReactNode;
};

export const StorageProvider = ({ children, persistor }: StorageProviderProps) => (
    <StorageContext.Provider value={persistor}>
        <PersistGate loading={null} persistor={persistor}>
            {children}
        </PersistGate>
    </StorageContext.Provider>
);
