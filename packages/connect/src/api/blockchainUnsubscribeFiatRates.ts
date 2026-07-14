// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainUnsubscribeFiatRates.js

import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodContext, MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
};

export default class BlockchainUnsubscribeFiatRates extends AbstractMethod<
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
        // validate backend
        isBackendSupported(coinInfo);

        const params = {
            coinInfo,
            identity: payload.identity,
        };

        super(message, params);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    async run({ sendCoreMessage }: MethodContext) {
        const backend = await initBlockchain(
            this.params.coinInfo,
            sendCoreMessage,
            this.params.identity,
        );

        return backend.unsubscribeFiatRates();
    }
}
