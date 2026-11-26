// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetCoinInfo.js

import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common';
import { GetCoinInfo as GetCoinInfoSchema } from '@trezor/connect-common/src/types/api/account/getCoinInfo';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetwork, getCoinInfoOrThrow, getEthereumNetwork } from '../data/coinInfo';
import { validatePath } from '../utils/pathUtils';

type Params = {
    coinInfo: CoinInfo;
};

type GetPathCoinInfoParams = Extract<GetCoinInfoSchema, { path: unknown }>;

const getPathCoinInfo = ({ path, networkType }: GetPathCoinInfoParams): CoinInfo => {
    const addressN = validatePath(path);
    const coinInfo =
        networkType === 'bitcoin' ? getBitcoinNetwork(addressN) : getEthereumNetwork(addressN);
    if (!coinInfo) {
        throw ERRORS.TypedError('Method_UnknownCoin');
    }

    return coinInfo;
};

export default class GetCoinInfo extends AbstractMethod<'getCoinInfo', Params> {
    constructor(message: MethodMessage<'getCoinInfo'>) {
        const { payload } = message;

        Assert(GetCoinInfoSchema, payload);

        const coinInfo =
            'coin' in payload ? getCoinInfoOrThrow(payload.coin) : getPathCoinInfo(payload);

        const params = { coinInfo };

        super(message, params);
        this.useDevice = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    run() {
        return Promise.resolve(this.params.coinInfo);
    }
}
