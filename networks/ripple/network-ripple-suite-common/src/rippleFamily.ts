import { defineFamily } from '@trezor/network-module-suite-common-types';
import { supportedRippleNetworks } from '@trezor/network-ripple-types';

import { getNetworkConfig } from './networkConfig';

/** No capability yet: the family exists so every Ripple symbol resolves to a network. */
export const rippleFamily = defineFamily<Record<never, never>>()({
    family: 'ripple',
    symbols: supportedRippleNetworks,
    getConfig: getNetworkConfig,
    capabilities: {},
});
