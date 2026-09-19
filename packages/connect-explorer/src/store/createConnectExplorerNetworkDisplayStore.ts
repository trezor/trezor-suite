import {
    type NetworkConfigState,
    type NetworkConfigStore,
    asNetworkSymbol,
} from '@trezor/network-module-types';
import { typedObjectFromEntries } from '@trezor/utils';

import { allCoinsSelect } from '../constants/coins';

export const createConnectExplorerNetworkDisplayStore = (): NetworkConfigStore => {
    // These hardcoded coin definitions supply the display fields that Suite normally gets
    // from its network modules. The shared NetworkConfigState/NetworkConfigStore contracts
    // and NetworkSymbol type let product components consume either source, without Explorer
    // depending on Suite's module registry or network Redux state. This config is fixed, so
    // the snapshot stays stable and subscriptions have nothing to observe.
    const networkConfigState: NetworkConfigState = {
        networks: typedObjectFromEntries(
            allCoinsSelect.map(coin => [asNetworkSymbol(coin.value), { name: coin.label }]),
        ),
    };

    return {
        getState: () => networkConfigState,
        subscribe: () => () => {},
    };
};
