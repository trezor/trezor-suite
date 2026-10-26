import { supportedEthereumNetworks } from '@trezor/network-ethereum-types';
import { defineCapability, defineFamily } from '@trezor/network-module-suite-common-types';

import {
    type EthereumMessageSigningDeps,
    createEthereumMessageSigning,
} from './messageSigning/createEthereumMessageSigning';
import { getNetworkConfig } from './networkConfig';

export type EthereumFamilyDeps = EthereumMessageSigningDeps;

/**
 * The EVM family. Its networks resolve under any backend that serves them, whether Blockbook or a
 * custom RPC; message signing only talks to the device, so it is available on both.
 */
export const ethereumFamily = defineFamily<EthereumFamilyDeps>()({
    family: 'ethereum',
    symbols: supportedEthereumNetworks,
    getConfig: getNetworkConfig,
    capabilities: {
        messageSigning: defineCapability({
            requires: { feature: 'sign-verify' },
            create: createEthereumMessageSigning,
        }),
    },
});
