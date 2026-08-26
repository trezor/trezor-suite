import { BlockchainLink } from '@trezor/blockchain-link';
import { MESSAGES, type ResponseTypes } from '@trezor/blockchain-link-types';
import { type PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { EvmRpcWorker } from '../workers/workers';
import { validateParams } from './common/paramsValidator';

type Params = { url: string };

type GetEvmChainId = ResponseTypes.GetEvmChainId;

export default class BlockchainEvmRpcGetChainId extends AbstractMethod<
    'blockchainEvmRpcGetChainId',
    Params
> {
    constructor(message: MethodMessage<'blockchainEvmRpcGetChainId'>) {
        const { payload } = message;

        validateParams(payload, [{ name: 'url', type: 'string', required: true }]);

        const params = { url: payload.url };

        super(message, params);
        this.useDevice = false;
        this.useUi = false;
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

            return { chainId };
        } finally {
            link.dispose();
        }
    }
}
