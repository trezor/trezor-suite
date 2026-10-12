import { type NetworkConfigs, asNetworkSymbol } from '@trezor/network-module-types';
import { typedObjectFromEntries } from '@trezor/utils';

import {
    type ConnectExplorerApp,
    type ConnectExplorerServices,
    createConnectExplorerApp,
} from './createConnectExplorerApp';
import { allCoinsSelect } from '../constants/coins';
import { createConnectExplorerReduxStore } from '../store/createConnectExplorerReduxStore';

type ConnectExplorerCompositionRoot = { app: ConnectExplorerApp };

export const createConnectExplorerCompositionRoot = (): ConnectExplorerCompositionRoot => {
    const networkConfig: NetworkConfigs = typedObjectFromEntries(
        allCoinsSelect.map(coin => [asNetworkSymbol(coin.value), { name: coin.label }]),
    );
    const connectExplorerReduxStore = createConnectExplorerReduxStore({
        networkConfig,
    });
    const services: ConnectExplorerServices = { connectExplorerReduxStore };
    const app = createConnectExplorerApp({ services });

    return { app };
};
