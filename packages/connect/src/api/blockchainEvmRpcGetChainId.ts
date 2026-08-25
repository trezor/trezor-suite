import { BlockchainLink } from '@trezor/blockchain-link';
import { MESSAGES, type ResponseTypes } from '@trezor/blockchain-link-types';
import { type PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { EvmRpcWorker } from '../workers/workers';
import { validateParams } from './common/paramsValidator';

type Params = {
    url: string;
    chainId: number;
};

type ValidateEvmRpc = ResponseTypes.GetEvmChainId;

export default class BlockchainValidateEvmRpcUrl extends AbstractMethod<
    'blockchainValidateEvmRpcUrl',
    Params
> {
    constructor(message: MethodMessage<'blockchainValidateEvmRpcUrl'>) {
        const { payload } = message;

        validateParams(payload, [
            { name: 'url', type: 'string', required: true },
            { name: 'chainId', type: 'number', required: true },
        ]);

        const params = {
            url: payload.url,
            chainId: payload.chainId,
        };

        super(message, params);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    get info() {
        return 'Validate EVM RPC URL';
    }

    async run() {
        const link = new BlockchainLink({
            name: 'evm-rpc-validator',
            worker: EvmRpcWorker,
            server: [],
            debug: false,
        });

        try {
            const actualChainId = await link.sendMessage<ValidateEvmRpc['payload']>({
                type: MESSAGES.GET_EVM_CHAIN_ID,
                payload: { url: this.params.url },
            });

            const valid = actualChainId === this.params.chainId;

            return { valid, actualChainId: Number(actualChainId) };
        } finally {
            link.dispose();
        }
    }
}
