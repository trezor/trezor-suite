// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainDisconnect.js

import { AbstractMethod } from '../core/AbstractMethod';
import { ERRORS } from '../constants';
import { isBackendSupported, findBackend } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';
import { CoinObj, CoinInfo } from '../types';
import { Assert } from '@trezor/schema-utils';

type Params = {
    coinInfo: CoinInfo;
};

export default class BlockchainDisconnect extends AbstractMethod<'blockchainDisconnect', Params> {
    init() {
        this.requiredPermissions = [];
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

        // validate incoming parameters
        Assert(CoinObj, payload);

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        this.params = {
            coinInfo,
        };
    }

    get info() {
        return '';
    }

    run() {
        const backend = findBackend(this.params.coinInfo.shortcut);
        if (backend) {
            backend.disconnect();
        }

        return Promise.resolve({ disconnected: true });
    }
}
