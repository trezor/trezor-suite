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
    const store = createConnectExplorerReduxStore({ networkConfig: connectExplorerNetworkConfig });
    const networkIcon = createConnectExplorerNetworkIcon({
        networkConfig: connectExplorerNetworkConfig,
    });
    const networks = { networkIcon };
    const services: ConnectExplorerServices = { store, networks };
    const app = createConnectExplorerApp({ services });

    return { app };
};
