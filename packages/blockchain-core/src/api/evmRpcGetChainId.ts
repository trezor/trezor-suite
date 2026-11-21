import { BlockchainLink } from '@trezor/blockchain-link';
import { MESSAGES, type ResponseTypes } from '@trezor/blockchain-link-types';

import { validateParams } from '../utils/validateParams';
import { EvmRpcWorker } from '../workers/workers';

/** Asks an EVM RPC node for its chain ID, e.g. to validate a custom backend before it's used. */
export const evmRpcGetChainId = async (params: { url: string }) => {
    validateParams(params, [{ name: 'url', type: 'string', required: true }]);
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

        return { chainId };
    } finally {
        link.dispose();
    }
};
