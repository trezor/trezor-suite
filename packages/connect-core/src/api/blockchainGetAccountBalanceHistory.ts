// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetAccountBalanceHistory.js

import { getAccountBalanceHistory } from '@trezor/blockchain-core/src/api/getAccountBalanceHistory';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
import type { MethodContext, MethodMessage, Payload } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    request: Omit<Payload<'blockchainGetAccountBalanceHistory'>, 'method' | 'coin'>;
};

export default class BlockchainGetAccountBalanceHistory extends AbstractBlockchainMethod<
    'blockchainGetAccountBalanceHistory',
    Params
> {
    constructor(message: MethodMessage<'blockchainGetAccountBalanceHistory'>) {
        const { payload } = message;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
            { name: 'descriptor', type: 'string', required: true },
            { name: 'from', type: 'number' },
            { name: 'to', type: 'number' },
            { name: 'groupBy', type: 'number' },
            { name: 'currencies', type: 'array' },
        ]);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const params = {
            coinInfo,
            identity: payload.identity,
            request: {
                descriptor: payload.descriptor,
                from: payload.from,
                to: payload.to,
                groupBy: payload.groupBy,
                currencies: payload.currencies,
            },
        };

        super(message, params);
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    run({ sendCoreMessage }: MethodContext) {
        return getAccountBalanceHistory(this.payload, sendCoreMessage);
    }
}
