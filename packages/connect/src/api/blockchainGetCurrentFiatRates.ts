// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetCurrentFiatRates.js

import { Payload, AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { ERRORS } from '../constants';
import { isBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/CoinInfo';
import type { CoinInfo } from '../types';

type Params = {
    coinInfo: CoinInfo;
    currencies: Payload<'blockchainGetCurrentFiatRates'>['currencies'];
};

export default class BlockchainGetCurrentFiatRates extends AbstractMethod<
    'blockchainGetCurrentFiatRates',
    Params
> {
    init() {
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'currencies', type: 'array', required: false },
            { name: 'coin', type: 'string', required: true },
        ]);

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        this.params = {
            currencies: payload.currencies,
            coinInfo,
        };
    }

    async run() {
        const backend = await initBlockchain(this.params.coinInfo, this.postMessage);
        return backend.getCurrentFiatRates({ currencies: this.params.currencies });
    }
}
