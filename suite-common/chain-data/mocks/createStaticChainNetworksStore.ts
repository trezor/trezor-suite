import type { ChainNetwork } from '@trezor/network-module-suite-common-types';

import type { ChainNetworksStore } from '../src/ChainNetworksStore';

/** A chain networks store that always holds the given networks. */
export const createStaticChainNetworksStore = (
    networks: readonly ChainNetwork[],
): ChainNetworksStore => ({
    getSnapshot: () => networks,
    subscribe: () => () => {},
});
