import { defineFamily } from '@trezor/network-module-suite-common-types';
import { supportedTronNetworks } from '@trezor/network-tron-types';

import { getNetworkConfig } from './networkConfig';

/** No capability yet: the family exists so every Tron symbol resolves to a network. */
export const tronFamily = defineFamily<Record<never, never>>()({
    family: 'tron',
    symbols: supportedTronNetworks,
    getConfig: getNetworkConfig,
    capabilities: {},
});
