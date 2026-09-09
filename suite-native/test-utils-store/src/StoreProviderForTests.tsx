import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { type Store } from '@reduxjs/toolkit';

import { useFormattersConfig } from '@suite-native/formatters-config';
import { BasicProviderForTests } from '@suite-native/test-utils';

type ReduxProviderProps<TServices extends { store: Store }> = {
    children: ReactNode;
    services: TServices;
};

const BasicProviderWithFormattingConfig = <TServices extends { store: Store }>({
    children,
    services,
}: ReduxProviderProps<TServices>) => {
    const formattersConfig = useFormattersConfig();

    return (
        <BasicProviderForTests formattersConfig={formattersConfig} services={services}>
            {children}
        </BasicProviderForTests>
    );
};

export const StoreProviderForTests = <TServices extends { store: Store }>({
    children,
    services,
}: ReduxProviderProps<TServices>) => (
    <Provider store={services.store}>
        <BasicProviderWithFormattingConfig services={services}>
            {children}
        </BasicProviderWithFormattingConfig>
    </Provider>
);
