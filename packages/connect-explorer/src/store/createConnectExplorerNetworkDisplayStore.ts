import { asNetworkSymbol } from '@trezor/network-module-types';
import type {
    NetworkDisplayState,
    NetworkDisplayStore,
} from '@trezor/product-components/network-display/config';
import { typedObjectFromEntries } from '@trezor/utils';

import { allCoinsSelect } from '../constants/coins';

export const createConnectExplorerNetworkDisplayStore = (): NetworkDisplayStore => {
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
