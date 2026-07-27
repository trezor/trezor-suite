import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { ServicesProvider } from '@suite-common/dependency-injection';
import { StorageProvider } from '@suite-native/storage';

import { type StoreWithExtra } from './store';

type StoreProviderProps = {
    children: ReactNode;
    store: StoreWithExtra;
};

export const StoreProvider = ({ children, store }: StoreProviderProps) => (
    <ServicesProvider services={store.services}>
        <Provider store={store.store}>
            <StorageProvider persistor={store.persistor}>{children}</StorageProvider>
        </Provider>
    </ServicesProvider>
);
