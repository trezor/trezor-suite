import { type ConnectExplorerApp, createConnectExplorerApp } from './createConnectExplorerApp';
import { createConnectExplorerReduxStore } from '../store/createConnectExplorerReduxStore';

type ConnectExplorerCompositionRoot = { app: ConnectExplorerApp };

export const createConnectExplorerCompositionRoot = (): ConnectExplorerCompositionRoot => {
    const store = createConnectExplorerReduxStore();

    return { app: createConnectExplorerApp({ services: { store } }) };
};
