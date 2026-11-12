// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetTransactions.js

import { TrezorBlockchain } from '@trezor/blockchain-core';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
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

    run() {
        // The payload is a union of the overloads' params, which no single overload accepts.
        const payload = this.payload as Parameters<typeof TrezorBlockchain.getTransactions>[0];

        return this.callBlockchain(TrezorBlockchain.getTransactions(payload));
    }
}
