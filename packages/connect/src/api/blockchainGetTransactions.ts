// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetTransactions.js

import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodContext, MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { assertBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    txs: string[];
    coinInfo: CoinInfo;
    identity?: string;
    descriptor?: string;
};

export default class BlockchainGetTransactions extends AbstractMethod<
    'blockchainGetTransactions',
    Params
> {
    constructor(message: MethodMessage<'blockchainGetTransactions'>) {
        const { payload } = message;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'txs', type: 'array', required: true },
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
            { name: 'descriptor', type: 'string' },
        ]);

        const coinInfo = getCoinInfoOrThrow(payload.coin);
        // validate backend
        assertBackendSupported(coinInfo);

        const params = {
            txs: payload.txs,
            coinInfo,
            identity: payload.identity,
            descriptor: payload.descriptor,
        };

        super(message, params);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    init() {}

    async run({ sendCoreMessage }: MethodContext) {
        const backend = await initBlockchain(
            this.params.coinInfo,
            sendCoreMessage,
            this.params.identity,
        );

        return backend.getTransactions(this.params.txs, this.params.descriptor);
    }
}
