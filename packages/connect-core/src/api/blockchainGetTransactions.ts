// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetTransactions.js

import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
import { getTransactions } from '../blockchain/api/getTransactions';
import type { MethodContext, MethodMessage } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    txs: string[];
    coinInfo: CoinInfo;
    identity?: string;
    descriptor?: string;
    hexOnly?: boolean;
};

export default class BlockchainGetTransactions extends AbstractBlockchainMethod<
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
            { name: 'hexOnly', type: 'boolean' },
        ]);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const params = {
            txs: payload.txs,
            coinInfo,
            identity: payload.identity,
            descriptor: payload.descriptor,
            hexOnly: payload.hexOnly,
        };

        super(message, params);
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    run({ sendCoreMessage }: MethodContext) {
        // The payload is a union of the overloads' params, which no single overload accepts.
        const payload = this.payload as Parameters<typeof getTransactions>[0];

        return getTransactions(payload, sendCoreMessage);
    }
}
