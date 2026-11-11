import { supportedBitcoinNetworks } from '@trezor/network-bitcoin-types';
import { defineCapability, defineFamily } from '@trezor/network-module-suite-common-types';

import {
    type BitcoinMessageSigningDeps,
    createBitcoinMessageSigning,
} from './messageSigning/createBitcoinMessageSigning';
import { getNetworkConfig } from './networkConfig';
import {
    blockbookBitcoinTransactionDetails,
    electrumBitcoinTransactionDetails,
} from './transactionDetails/bitcoinTransactionDetails';

export type BitcoinFamilyDeps = BitcoinMessageSigningDeps;

export const bitcoinFamily = defineFamily<BitcoinFamilyDeps>()({
    family: 'bitcoin',
    symbols: supportedBitcoinNetworks,
    getConfig: getNetworkConfig,
    capabilities: {
        messageSigning: defineCapability({
            requires: { feature: 'sign-verify' },
            create: createBitcoinMessageSigning,
        }),
        transactionDetails: [
            defineCapability({
                requires: { backends: ['electrum'] },
                create: () => electrumBitcoinTransactionDetails,
            }),
            defineCapability({ requires: {}, create: () => blockbookBitcoinTransactionDetails }),
        ],
    },
});
