import { defineCapability, defineFamily } from '@trezor/network-module-suite-common-types';
import { supportedTronNetworks } from '@trezor/network-tron-types';

import { getNetworkConfig } from './networkConfig';
import { tronTransactionDetails } from './transactionDetails/tronTransactionDetails';

/** The Tron family: no message signing yet, and the transaction facts its backend reports. */
export const tronFamily = defineFamily<Record<never, never>>()({
    family: 'tron',
    symbols: supportedTronNetworks,
    getConfig: getNetworkConfig,
    capabilities: {
        transactionDetails: defineCapability({
            requires: {},
            create: () => tronTransactionDetails,
        }),
    },
});
