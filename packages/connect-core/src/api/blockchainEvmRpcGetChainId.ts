import { evmRpcGetChainId } from '@trezor/blockchain-core/src/api/evmRpcGetChainId';
import { type PermissionRequest } from '@trezor/connect-common';

import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
import type { MethodMessage } from '../core/AbstractMethod';

type Params = { url: string };

export default class BlockchainEvmRpcGetChainId extends AbstractBlockchainMethod<
    'blockchainEvmRpcGetChainId',
    Params
> {
    constructor(message: MethodMessage<'blockchainEvmRpcGetChainId'>) {
        const { payload } = message;

        validateParams(payload, [{ name: 'url', type: 'string', required: true }]);

        const params = { url: payload.url };

        super(message, params);
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    get info() {
        return 'Get EVM RPC Chain ID';
    }

    run() {
        return evmRpcGetChainId(this.payload);
    }
}
