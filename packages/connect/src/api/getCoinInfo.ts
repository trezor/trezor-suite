// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetCoinInfo.js

import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';
import { CoinObj } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
};

export default class GetCoinInfo extends AbstractMethod<'getCoinInfo', Params> {
    constructor(message: MethodMessage<'getCoinInfo'>) {
        const { payload } = message;

        Assert(CoinObj, payload);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const params = { coinInfo };

        super(message, params);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    run() {
        return Promise.resolve(this.params.coinInfo);
    }
}
