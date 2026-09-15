import { type ComponentType } from 'react';

import { type AppProps } from 'next/app';

import { type CoinIcons } from '@trezor/connect-explorer-theme';

import { ConnectExplorerAppRoot } from '../ConnectExplorerAppRoot';
import { type ConnectExplorerReduxStore } from '../store/createConnectExplorerReduxStore';

export type ConnectExplorerServices = {
    store: ConnectExplorerReduxStore;
    coinIcons: CoinIcons;
};

type ConnectExplorerAppDeps = {
    services: ConnectExplorerServices;
};

export type ConnectExplorerApp = () => ComponentType<AppProps>;

export const createConnectExplorerApp = (deps: ConnectExplorerAppDeps): ConnectExplorerApp => {
    const AppWithServices = (props: AppProps) => (
        <ConnectExplorerAppRoot
            {...props}
            store={deps.services.store}
            coinIcons={deps.services.coinIcons}
        />
    );

    // Next owns rendering and hydration; browser lifecycle effects run when this component mounts.
    return () => AppWithServices;
};
