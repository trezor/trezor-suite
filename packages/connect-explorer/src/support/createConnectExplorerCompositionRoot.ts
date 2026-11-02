import type { NetworkRoute, NetworkRouteToSymbolMap } from '@trezor/connect-explorer-theme';
import type { NetworkConfigs, NetworkSymbol } from '@trezor/network-module-types';
import { typedObjectFromEntries } from '@trezor/utils';

import {
    type ConnectExplorerApp,
    type ConnectExplorerServices,
    createConnectExplorerApp,
} from './createConnectExplorerApp';
import { createConnectExplorerNetworkIcon } from './createConnectExplorerNetworkIcon';
import { connectExplorerNetworkConfig } from '../config/networks';
import { createConnectExplorerReduxStore } from '../store/createConnectExplorerReduxStore';

type ConnectExplorerCompositionRoot = { app: ConnectExplorerApp };

export const createConnectExplorerCompositionRoot = (): ConnectExplorerCompositionRoot => {
    const networkConfig: NetworkConfigs = typedObjectFromEntries(
        connectExplorerNetworkConfig.map(network => [
            network.symbol,
            { name: network.name, testnet: network.testnet },
        ]),
    );
    const networkRouteToSymbolMap: NetworkRouteToSymbolMap = typedObjectFromEntries(
        connectExplorerNetworkConfig.flatMap(
            ({ route, symbol }): [NetworkRoute, NetworkSymbol][] =>
                route === null ? [] : [[route, symbol]],
        ),
    );
    const connectExplorerReduxStore = createConnectExplorerReduxStore({
        networkConfig,
        networkRouteToSymbolMap,
    });
    const networkIcon = createConnectExplorerNetworkIcon({
        networkConfig: connectExplorerNetworkConfig,
    });
    const networks = { networkIcon, isWrappedNativeToken: () => false };
    const services: ConnectExplorerServices = { connectExplorerReduxStore, networks };
    const app = createConnectExplorerApp({ services });

    return { app };
};
