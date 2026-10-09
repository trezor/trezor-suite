import { type ComponentType } from 'react';

import { type AppProps } from 'next/app';

import { ServicesProvider } from '@trezor/dependency-injection';
import type { ProductComponentsServices } from '@trezor/product-components';

import { ConnectExplorerAppRoot } from '../ConnectExplorerAppRoot';
import { type ConnectExplorerReduxStore } from '../store/createConnectExplorerReduxStore';

export type ConnectExplorerServices = ProductComponentsServices & {
    store: ConnectExplorerReduxStore;
};

type ConnectExplorerAppDeps = {
    services: ConnectExplorerServices;
};

export type ConnectExplorerApp = () => ComponentType<AppProps>;

export const createConnectExplorerApp = (deps: ConnectExplorerAppDeps): ConnectExplorerApp => {
    const AppWithServices = (props: AppProps) => (
        <ServicesProvider services={deps.services}>
            <ConnectExplorerAppRoot {...props} />
        </ServicesProvider>
    );

    // Next owns rendering and hydration; browser lifecycle effects run when this component mounts.
    return () => AppWithServices;
};
