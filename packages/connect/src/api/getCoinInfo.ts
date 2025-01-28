// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetCoinInfo.js

import { Assert } from '@trezor/schema-utils';

import { ERRORS } from '../constants';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';
import { CoinInfo, CoinObj } from '../types';

type Params = {
    coinInfo: CoinInfo;
};

export default class GetCoinInfo extends AbstractMethod<'getCoinInfo', Params> {
    init() {
        this.requiredPermissions = [];
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

        Assert(CoinObj, payload);

        const coinInfo = getCoinInfo(payload.coin);
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
