// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetCoinInfo.js

import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { ERRORS } from '../constants';
import { getCoinInfo } from '../data/coinInfo';
import type { CoinInfo } from '../types';

type Params = {
    coinInfo: CoinInfo;
};

export default class GetCoinInfo extends AbstractMethod<'getCoinInfo', Params> {
    async init() {
        this.requiredPermissions = [];
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

        validateParams(payload, [{ name: 'coin', type: 'string', required: true }]);

        const coinInfo = await getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }

        this.params = {
            coinInfo,
        };
    }

    run() {
        return Promise.resolve(this.params.coinInfo);
    }
}
