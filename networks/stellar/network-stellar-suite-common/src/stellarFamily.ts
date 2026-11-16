import { defineCapability, defineFamily } from '@trezor/network-module-suite-common-types';
import { supportedStellarNetworks } from '@trezor/network-stellar-types';

import { getNetworkConfig } from './networkConfig';
import { stellarSendOptions } from './sendOptions/stellarSendOptions';
import { stellarTransactionDetails } from './transactionDetails/stellarTransactionDetails';

/** The Stellar family: no message signing yet, and the transaction facts its backend reports. */
export const stellarFamily = defineFamily<Record<never, never>>()({
    family: 'stellar',
    symbols: supportedStellarNetworks,
    getConfig: getNetworkConfig,
    capabilities: {
        transactionDetails: defineCapability({
            requires: {},
            create: () => stellarTransactionDetails,
        }),
        sendOptions: defineCapability({ requires: {}, create: () => stellarSendOptions }),
    },
});
