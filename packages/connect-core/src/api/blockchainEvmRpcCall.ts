import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import { assertBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import type { MethodContext, MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    request: Omit<Payload<'blockchainEvmRpcCall'>, 'method' | 'coin'>;
};

export default class BlockchainEvmRpcCall extends AbstractMethod<'blockchainEvmRpcCall', Params> {
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
        // validate backend
        assertBackendSupported(coinInfo);

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
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    get info() {
        return 'Blockchain Evm Rpc Call';
    }

    async run({ sendCoreMessage }: MethodContext) {
        const backend = await initBlockchain(
            this.params.coinInfo,
            sendCoreMessage,
            this.params.identity,
        );
        const response = await backend.rpcCall(this.params.request);

        return response;
    }
}
