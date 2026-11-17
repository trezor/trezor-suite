import { BlockchainLink } from '@trezor/blockchain-link';
import { MESSAGES, type ResponseTypes } from '@trezor/blockchain-link-types';
import { type PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { EvmRpcWorker } from '../workers/workers';
import { validateParams } from './common/paramsValidator';

type Params = { url: string; measureBlockTime: boolean };

type GetEvmChainId = ResponseTypes.GetEvmChainId;
type GetEvmBlockTime = ResponseTypes.GetEvmBlockTime;

export default class BlockchainEvmRpcGetChainId extends AbstractMethod<
    'blockchainEvmRpcGetChainId',
    Params
> {
    constructor(message: MethodMessage<'blockchainEvmRpcGetChainId'>) {
        const { payload } = message;

        validateParams(payload, [
            { name: 'url', type: 'string', required: true },
            { name: 'measureBlockTime', type: 'boolean' },
        ]);

        const params = { url: payload.url, measureBlockTime: !!payload.measureBlockTime };

        super(message, params);
        this.useDevice = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    get info() {
        return 'Get EVM RPC Chain ID';
    }

    async run() {
        const link = new BlockchainLink({
            name: 'evm-rpc-validator',
            worker: EvmRpcWorker,
            server: [],
            debug: false,
        });

        try {
            const chainId = await link.sendMessage<GetEvmChainId['payload']>({
                type: MESSAGES.GET_EVM_CHAIN_ID,
                payload: { url: this.params.url },
            });

            if (!this.params.measureBlockTime) {
                return { chainId };
            }

            // The chain id answers whether the RPC can be used at all; a node that cannot serve
            // older blocks is still usable, it just leaves the block time to the caller's default.
            const blockTimeSeconds = await link
                .sendMessage<GetEvmBlockTime['payload']>({
                    type: MESSAGES.GET_EVM_BLOCK_TIME,
                    payload: { url: this.params.url },
                })
                .catch(() => undefined);

            return { chainId, blockTimeSeconds };
        } finally {
            link.dispose();
        }
    }
}
