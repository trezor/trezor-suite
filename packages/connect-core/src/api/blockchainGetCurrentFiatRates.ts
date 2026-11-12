// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetCurrentFiatRates.js

import { TrezorBlockchain } from '@trezor/blockchain-core';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
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

    run() {
        return this.callBlockchain(TrezorBlockchain.getCurrentFiatRates(this.payload));
    }
}
