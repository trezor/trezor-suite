import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { StorageProvider } from '@suite-native/storage';
import { ServicesProvider } from '@trezor/dependency-injection';

import { type NativeServices } from './NativeServices';
import { type NativeReduxStoreDep } from './createReduxStore';
import { type StorePersistorDep } from './createStorePersistor';

type StoreProviderProps = {
    children: ReactNode;
    services: NativeServices & NativeReduxStoreDep & StorePersistorDep;
};

export const StoreProvider = ({ children, services }: StoreProviderProps) => (
    <ServicesProvider services={services}>
        <Provider store={services.store}>
            <StorageProvider persistor={services.storePersistor}>{children}</StorageProvider>
        </Provider>
    </ServicesProvider>
);
