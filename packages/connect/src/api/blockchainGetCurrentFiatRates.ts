// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetCurrentFiatRates.js

import type { CoinInfo } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type {
    MethodContext,
    MethodMessage,
    MethodPermission,
    Payload,
} from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    currencies: Payload<'blockchainGetCurrentFiatRates'>['currencies'];
    token: Payload<'blockchainGetCurrentFiatRates'>['token'];
};

export default class BlockchainGetCurrentFiatRates extends AbstractMethod<
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

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        const params = {
            currencies: payload.currencies,
            token: payload.token,
            coinInfo,
            identity: payload.identity,
        };

        super(message, params);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    async run({ sendCoreMessage }: MethodContext) {
        const backend = await initBlockchain(
            this.params.coinInfo,
            sendCoreMessage,
            this.params.identity,
        );

        return backend.getCurrentFiatRates({
            currencies: this.params.currencies,
            token: this.params.token,
        });
    }
}
