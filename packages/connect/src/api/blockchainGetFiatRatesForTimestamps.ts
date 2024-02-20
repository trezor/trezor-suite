// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetFiatRatesForTimestamps.js

import { Payload, AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { ERRORS } from '../constants';
import { isBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';
import type { CoinInfo } from '../types';

type Params = {
    coinInfo: CoinInfo;
    currencies: Payload<'blockchainGetFiatRatesForTimestamps'>['currencies'];
    timestamps: Payload<'blockchainGetFiatRatesForTimestamps'>['timestamps'];
    token: Payload<'blockchainGetFiatRatesForTimestamps'>['token'];
};

export default class BlockchainGetFiatRatesForTimestamps extends AbstractMethod<
    'blockchainGetFiatRatesForTimestamps',
    Params
> {
    init() {
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'currencies', type: 'array', required: false },
            { name: 'timestamps', type: 'array', required: true },
            { name: 'token', type: 'string' },
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
            timestamps: payload.timestamps,
            token: payload.token,
            coinInfo,
        };
    }

    async run() {
        const backend = await initBlockchain(this.params.coinInfo, this.postMessage);

        return backend.getFiatRatesForTimestamps({
            currencies: this.params.currencies,
            timestamps: this.params.timestamps,
            token: this.params.token,
        });
    }
}
