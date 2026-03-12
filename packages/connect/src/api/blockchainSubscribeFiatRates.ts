// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainSubscribeFiatRates.js

import { ERRORS } from '@trezor/connect-common/src/constants';

import type { MethodMessage, MethodPermission, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';
import type { CoinInfo } from '../types';

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
        super(message);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    init() {
        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'currency', type: 'string', required: false },
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
        ]);

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        this.params = {
            currency: payload.currency,
            coinInfo,
            identity: payload.identity,
        };
    }

    async run() {
        const backend = await initBlockchain(
            this.params.coinInfo,
            this.postMessage,
            this.params.identity,
        );

        return backend.subscribeFiatRates(this.params.currency);
    }
}
