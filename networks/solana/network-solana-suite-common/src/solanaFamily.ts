import { defineCapability, defineFamily } from '@trezor/network-module-suite-common-types';
import { supportedSolanaNetworks } from '@trezor/network-solana-types';

import { getNetworkConfig } from './networkConfig';
import { solanaTransactionDetails } from './transactionDetails/solanaTransactionDetails';

/** The Solana family: no message signing yet, and the transaction facts its backend reports. */
export const solanaFamily = defineFamily<Record<never, never>>()({
    family: 'solana',
    symbols: supportedSolanaNetworks,
    getConfig: getNetworkConfig,
    capabilities: {
        transactionDetails: defineCapability({
            requires: {},
            create: () => solanaTransactionDetails,
        }),
    },
});
