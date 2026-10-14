import { type Middleware, type Store, applyMiddleware, compose, createStore } from 'redux';
import { createLogger } from 'redux-logger';
import { thunk } from 'redux-thunk';

import type { NetworkRouteToSymbolMap } from '@trezor/connect-explorer-theme';
import type { NetworkConfigs } from '@trezor/network-module-types';

import { trezorConnectMiddleware } from '../middlewares/trezorConnectMiddleware';
import { type AppState, reducers } from '../reducers';
import { type Action, type Dispatch } from '../types';

type ConnectExplorerReduxStoreDeps = {
    networkConfig: NetworkConfigs;
    networkRouteToSymbolMap: NetworkRouteToSymbolMap;
};

export type ConnectExplorerReduxStore = Store<AppState, Action>;

export type ConnectExplorerReduxStoreDep = {
    connectExplorerReduxStore: ConnectExplorerReduxStore;
};

export const createConnectExplorerReduxStore = (
    deps: ConnectExplorerReduxStoreDeps,
): ConnectExplorerReduxStore => {
    const enhancers: any[] = [];
    const middleware = [thunk, trezorConnectMiddleware] as Middleware<Dispatch, AppState>[];

    let composedEnhancers: any;
    if (process.env.NODE_ENV === 'development') {
        const logger = createLogger({
            level: 'info',
            collapsed: true,
        });

        if (typeof window !== 'undefined') {
            // @ts-expect-error
            const { devToolsExtension } = window;
            if (typeof devToolsExtension === 'function') {
                enhancers.push(devToolsExtension());
            }
        }

        composedEnhancers = compose(applyMiddleware(...middleware, logger), ...enhancers);
    } else {
        composedEnhancers = compose(applyMiddleware(...middleware), ...enhancers);
    }

    return createStore(
        reducers,
        { networks: deps.networkConfig, networkRouteToSymbolMap: deps.networkRouteToSymbolMap },
        composedEnhancers,
    );
};

export const injectConnectExplorerReduxStore = (
    services: ConnectExplorerReduxStoreDep,
): ConnectExplorerReduxStoreDep => ({
    connectExplorerReduxStore: services.connectExplorerReduxStore,
});
