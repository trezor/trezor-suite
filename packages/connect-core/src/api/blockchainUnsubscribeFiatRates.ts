// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainUnsubscribeFiatRates.js

import { TrezorBlockchain } from '@trezor/blockchain-core';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
};

export default class BlockchainUnsubscribeFiatRates extends AbstractBlockchainMethod<
    'blockchainUnsubscribeFiatRates',
    Params
> {
    constructor(message: MethodMessage<'blockchainUnsubscribeFiatRates'>) {
        const { payload } = message;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
        ]);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const params = {
            coinInfo,
            identity: payload.identity,
        };

        super(message, params);
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    run() {
        return this.callBlockchain(TrezorBlockchain.unsubscribeFiatRates(this.payload));
    }
}
