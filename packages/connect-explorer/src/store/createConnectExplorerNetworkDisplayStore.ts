import { asNetworkSymbol } from '@trezor/network-module-types';
import type { NetworkDisplayState, NetworkDisplayStore } from '@trezor/product-components';
import { typedObjectFromEntries } from '@trezor/utils';

import { allCoinsSelect } from '../constants/coins';

export const createConnectExplorerNetworkDisplayStore = (): NetworkDisplayStore => {
    // These hardcoded coin definitions supply the display fields that Suite normally gets
    // from its network modules. The shared NetworkDisplayState/NetworkDisplayStore contracts
    // and NetworkSymbol type let product components consume either source, without Explorer
    // depending on Suite's module registry or network Redux state. This config is fixed, so
    // the snapshot stays stable and subscriptions have nothing to observe.
    const networkDisplayState: NetworkDisplayState = {
        networks: typedObjectFromEntries(
            allCoinsSelect.map(coin => [asNetworkSymbol(coin.value), { name: coin.label }]),
        ),
    };

    return {
        getState: () => networkDisplayState,
        subscribe: () => () => {},
    };
};
