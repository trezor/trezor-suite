// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetCoinInfo.js

import type { CoinInfo } from '@trezor/connect-common';
import { CoinObj } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
};

export default class GetCoinInfo extends AbstractMethod<'getCoinInfo', Params> {
    constructor(message: MethodMessage<'getCoinInfo'>) {
        super(message);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    init() {
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
