// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetFiatRatesForTimestamps.js

import { TrezorBlockchain } from '@trezor/blockchain-core';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    currencies: Payload<'blockchainGetFiatRatesForTimestamps'>['currencies'];
    timestamps: Payload<'blockchainGetFiatRatesForTimestamps'>['timestamps'];
    token: Payload<'blockchainGetFiatRatesForTimestamps'>['token'];
};

export default class BlockchainGetFiatRatesForTimestamps extends AbstractBlockchainMethod<
    'blockchainGetFiatRatesForTimestamps',
    Params
> {
    constructor(message: MethodMessage<'blockchainGetFiatRatesForTimestamps'>) {
        const { payload } = message;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'currencies', type: 'array', required: false },
            { name: 'timestamps', type: 'array', required: true },
            { name: 'token', type: 'string' },
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
        ]);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const params = {
            currencies: payload.currencies,
            timestamps: payload.timestamps,
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
        return this.callBlockchain(TrezorBlockchain.getFiatRatesForTimestamps(this.payload));
    }
}
