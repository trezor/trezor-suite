// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainSubscribeFiatRates.js

import { TrezorBlockchain } from '@trezor/blockchain-core';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    currency: Payload<'blockchainSubscribeFiatRates'>['currency'];
    coinInfo: CoinInfo;
    identity?: string;
};

export default class BlockchainSubscribeFiatRates extends AbstractBlockchainMethod<
    'blockchainSubscribeFiatRates',
    Params
> {
    constructor(message: MethodMessage<'blockchainSubscribeFiatRates'>) {
        const { payload } = message;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'currency', type: 'string', required: false },
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
        ]);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const params = {
            currency: payload.currency,
            coinInfo,
            identity: payload.identity,
        };

        super(message, params);
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    run() {
        return this.callBlockchain(TrezorBlockchain.subscribeFiatRates(this.payload));
    }
}
