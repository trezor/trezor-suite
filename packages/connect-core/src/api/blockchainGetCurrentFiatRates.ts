// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetCurrentFiatRates.js

import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
import { getCurrentFiatRates } from '../blockchain/api/getCurrentFiatRates';
import type { MethodContext, MethodMessage, Payload } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    currencies: Payload<'blockchainGetCurrentFiatRates'>['currencies'];
    token: Payload<'blockchainGetCurrentFiatRates'>['token'];
};

export default class BlockchainGetCurrentFiatRates extends AbstractBlockchainMethod<
    'blockchainGetCurrentFiatRates',
    Params
> {
    constructor(message: MethodMessage<'blockchainGetCurrentFiatRates'>) {
        const { payload } = message;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'currencies', type: 'array', required: false },
            { name: 'token', type: 'string' },
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
        ]);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const params = {
            currencies: payload.currencies,
            token: payload.token,
            coinInfo,
            identity: payload.identity,
        };

        super(message, params);
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    run({ sendCoreMessage }: MethodContext) {
        return getCurrentFiatRates(this.payload, sendCoreMessage);
    }
}
