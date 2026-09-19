import { asNetworkSymbol } from '@trezor/network-module-types';
import type {
    NetworkDisplayState,
    NetworkDisplayStore,
} from '@trezor/product-components/network-display/config';
import { typedObjectFromEntries } from '@trezor/utils';

import { type ConnectExplorerApp, createConnectExplorerApp } from './createConnectExplorerApp';
import { allCoinsSelect } from '../constants/coins';
import { createConnectExplorerReduxStore } from '../store/createConnectExplorerReduxStore';

type ConnectExplorerCompositionRoot = { app: ConnectExplorerApp };

export const createConnectExplorerCompositionRoot = (): ConnectExplorerCompositionRoot => {
    const store = createConnectExplorerReduxStore();
    const networkDisplayState: NetworkDisplayState = {
        networks: typedObjectFromEntries(
            allCoinsSelect.map(coin => [asNetworkSymbol(coin.value), { name: coin.label }]),
        ),
    };
    const networkDisplayStore: NetworkDisplayStore = {
        getState: () => networkDisplayState,
        subscribe: () => () => {},
    };

    return { app: createConnectExplorerApp({ services: { store, networkDisplayStore } }) };
};
