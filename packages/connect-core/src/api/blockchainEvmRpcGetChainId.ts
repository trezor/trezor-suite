import { TrezorBlockchain } from '@trezor/blockchain-core';
import { type PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';

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
        return this.callBlockchain(TrezorBlockchain.evmRpcGetChainId(this.payload));
    }
}
