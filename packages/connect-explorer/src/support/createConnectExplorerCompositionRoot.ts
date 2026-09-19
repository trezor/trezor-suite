import { type ConnectExplorerApp, createConnectExplorerApp } from './createConnectExplorerApp';
import { createConnectExplorerNetworkDisplayStore } from '../store/createConnectExplorerNetworkDisplayStore';
import { createConnectExplorerReduxStore } from '../store/createConnectExplorerReduxStore';

type ConnectExplorerCompositionRoot = { app: ConnectExplorerApp };

export const createConnectExplorerCompositionRoot = (): ConnectExplorerCompositionRoot => {
    const store = createConnectExplorerReduxStore();
    const networkDisplayStore = createConnectExplorerNetworkDisplayStore();

    return { app: createConnectExplorerApp({ services: { store, networkDisplayStore } }) };
};
