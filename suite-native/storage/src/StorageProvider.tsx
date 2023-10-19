import { ReactNode } from 'react';

import { Persistor } from 'redux-persist/es/types';
import { PersistGate } from 'redux-persist/integration/react';

import { StorageContext } from './contexts';

type StorageProviderProps = {
    persistor: Persistor;
    children: ReactNode;
};

export const StorageProvider = ({ children, persistor }: StorageProviderProps) => (
    <StorageContext.Provider value={persistor}>
        <PersistGate loading={null} persistor={persistor}>
            {children}
        </PersistGate>
    </StorageContext.Provider>
);
