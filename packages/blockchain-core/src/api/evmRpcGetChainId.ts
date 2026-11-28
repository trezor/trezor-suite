import { BlockchainLink } from '@trezor/blockchain-link';
import { MESSAGES, type ResponseTypes } from '@trezor/blockchain-link-types';

import { validateParams } from '../utils/validateParams';
import { EvmRpcWorker } from '../workers/workers';

/**
 * Asks an EVM RPC node for its chain ID, e.g. to validate a custom backend before it's used, and
 * optionally for the average block time of the chain.
 */
export const evmRpcGetChainId = async (params: { url: string; measureBlockTime?: boolean }) => {
    validateParams(params, [
        { name: 'url', type: 'string', required: true },
        { name: 'measureBlockTime', type: 'boolean' },
    ]);
    const link = new BlockchainLink({
        name: 'evm-rpc-validator',
        worker: EvmRpcWorker,
        server: [],
        debug: false,
    });

    try {
        const chainId = await link.sendMessage<ResponseTypes.GetEvmChainId['payload']>({
            type: MESSAGES.GET_EVM_CHAIN_ID,
            payload: { url: params.url },
        });

        if (!params.measureBlockTime) {
            return { chainId };
        }

        // The chain ID answers whether the RPC can be used at all; a node that cannot serve older
        // blocks is still usable, it just leaves the block time to the caller's default.
        const blockTimeSeconds = await link
            .sendMessage<ResponseTypes.GetEvmBlockTime['payload']>({
                type: MESSAGES.GET_EVM_BLOCK_TIME,
                payload: { url: params.url },
            })
            .catch(() => undefined);

        return { chainId, blockTimeSeconds };
    } finally {
        link.dispose();
    }
};
