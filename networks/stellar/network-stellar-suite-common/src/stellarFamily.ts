import { defineFamily } from '@trezor/network-module-suite-common-types';
import { supportedStellarNetworks } from '@trezor/network-stellar-types';

import { getNetworkConfig } from './networkConfig';

/** No capability yet: the family exists so every Stellar symbol resolves to a network. */
export const stellarFamily = defineFamily<Record<never, never>>()({
    family: 'stellar',
    symbols: supportedStellarNetworks,
    getConfig: getNetworkConfig,
    capabilities: {},
});
