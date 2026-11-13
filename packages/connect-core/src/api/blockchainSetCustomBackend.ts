// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainSetCustomBackend.js

import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
import { setCustomBackend } from '../blockchain/api/setCustomBackend';
import type { MethodMessage } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    blockchainLink?: {
        type: string;
        url: string[];
    };
};

export default class BlockchainSetCustomBackend extends AbstractBlockchainMethod<
    'blockchainSetCustomBackend',
    Params
> {
    constructor(message: MethodMessage<'blockchainSetCustomBackend'>) {
        const { payload } = message;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'blockchainLink', type: 'object' },
        ]);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const { blockchainLink } = payload;

        const params = { coinInfo, blockchainLink };

        super(message, params);
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'internal' }];
    }

    run() {
        return setCustomBackend(this.payload);
    }
}
