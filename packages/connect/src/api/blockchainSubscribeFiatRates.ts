// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainSubscribeFiatRates.js

import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodContext, MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    currency: Payload<'blockchainSubscribeFiatRates'>['currency'];
    coinInfo: CoinInfo;
    identity?: string;
};

export default class BlockchainSubscribeFiatRates extends AbstractMethod<
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
        // validate backend
        isBackendSupported(coinInfo);

        const params = {
            currency: payload.currency,
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

    init() {}

    async run({ sendCoreMessage }: MethodContext) {
        const backend = await initBlockchain(
            this.params.coinInfo,
            sendCoreMessage,
            this.params.identity,
        );

        return backend.subscribeFiatRates(this.params.currency);
    }
}
