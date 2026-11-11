import { defineCapability, defineFamily } from '@trezor/network-module-suite-common-types';
import { supportedRippleNetworks } from '@trezor/network-ripple-types';

import { getNetworkConfig } from './networkConfig';
import { rippleTransactionDetails } from './transactionDetails/rippleTransactionDetails';

/** The Ripple family: no message signing yet, and the transaction facts its backend reports. */
export const rippleFamily = defineFamily<Record<never, never>>()({
    family: 'ripple',
    symbols: supportedRippleNetworks,
    getConfig: getNetworkConfig,
    capabilities: {
        transactionDetails: defineCapability({
            requires: {},
            create: () => rippleTransactionDetails,
        }),
    },
});
