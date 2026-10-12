import { type ComponentType } from 'react';

import { type AppProps } from 'next/app';

import { ServicesProvider } from '@trezor/dependency-injection';

import { ConnectExplorerAppRoot } from '../ConnectExplorerAppRoot';
import { type ConnectExplorerReduxStoreDep } from '../store/createConnectExplorerReduxStore';

export type ConnectExplorerServices = ConnectExplorerReduxStoreDep;

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
