import { supportedEthereumNetworks } from '@trezor/network-ethereum-types';
import { defineCapability, defineFamily } from '@trezor/network-module-suite-common-types';

import {
    type EthereumMessageSigningDeps,
    createEthereumMessageSigning,
} from './messageSigning/createEthereumMessageSigning';
import { getNetworkConfig } from './networkConfig';
import {
    blockbookEvmTransactionDetails,
    evmRpcTransactionDetails,
} from './transactionDetails/ethereumTransactionDetails';

export type EthereumFamilyDeps = EthereumMessageSigningDeps;

/**
 * The EVM family. Its networks resolve under any backend that serves them, whether Blockbook or a
 * custom RPC. Message signing only talks to the device, so it is the same on both; transaction
 * details depend on what the backend reports, so each backend has its own.
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
        transactionDetails: [
            defineCapability({
                requires: { backends: ['evm-rpc'] },
                create: () => evmRpcTransactionDetails,
            }),
            defineCapability({ requires: {}, create: () => blockbookEvmTransactionDetails }),
        ],
    },
});
