import { type ComponentType } from 'react';

import { type AppProps } from 'next/app';

import { ConnectExplorerAppRoot } from '../ConnectExplorerAppRoot';
import { type ConnectExplorerReduxStore } from '../store/createConnectExplorerReduxStore';

export type ConnectExplorerServices = {
    store: ConnectExplorerReduxStore;
};

type ConnectExplorerAppDeps = {
    services: ConnectExplorerServices;
};

export type ConnectExplorerApp = () => ComponentType<AppProps>;

export const createConnectExplorerApp = (deps: ConnectExplorerAppDeps): ConnectExplorerApp => {
    const AppWithServices = (props: AppProps) => (
        <ConnectExplorerAppRoot {...props} store={deps.services.store} />
    );

    // Next owns rendering and hydration; browser lifecycle effects run when this component mounts.
    return () => AppWithServices;
};
