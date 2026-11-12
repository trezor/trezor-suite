import { TrezorBlockchain } from '@trezor/blockchain-core';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    request: Omit<Payload<'blockchainEvmRpcCall'>, 'method' | 'coin'>;
};

export default class BlockchainEvmRpcCall extends AbstractBlockchainMethod<
    'blockchainEvmRpcCall',
    Params
> {
    constructor(message: MethodMessage<'blockchainEvmRpcCall'>) {
        const { payload } = message;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
            { name: 'from', type: 'string' },
            { name: 'to', type: 'string', required: true },
            { name: 'data', type: 'string', required: true },
        ]);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const params = {
            coinInfo,
            identity: payload.identity,
            request: {
                from: payload.from,
                to: payload.to,
                data: payload.data,
            },
        };

        super(message, params);
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    get info() {
        return 'Blockchain Evm Rpc Call';
    }

    run() {
        return this.callBlockchain(TrezorBlockchain.evmRpcCall(this.payload));
    }
}
