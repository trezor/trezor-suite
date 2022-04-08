// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetFiatRatesForTimestamps.js

import { Payload, AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { ERRORS } from '../constants';
import { isBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/CoinInfo';
import type { CoinInfo } from '../types';

type Params = {
    coinInfo: CoinInfo;
    timestamps: Payload<'blockchainGetFiatRatesForTimestamps'>['timestamps'];
};

export default class BlockchainGetFiatRatesForTimestamps extends AbstractMethod<'blockchainGetFiatRatesForTimestamps'> {
    params: Params;

    init() {
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'timestamps', type: 'array', required: true },
            { name: 'coin', type: 'string', required: true },
        ]);

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        this.params = {
            timestamps: payload.timestamps,
            coinInfo,
        };
    }

    async run() {
        const backend = await initBlockchain(this.params.coinInfo, this.postMessage);
        return backend.getFiatRatesForTimestamps({ timestamps: this.params.timestamps });
    }
}
