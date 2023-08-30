// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainDisconnect.js

import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { ERRORS } from '../constants';
import { isBackendSupported, findBackend } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';
import type { CoinInfo } from '../types';

type Params = {
    coinInfo: CoinInfo;
};

export default class BlockchainDisconnect extends AbstractMethod<'blockchainDisconnect', Params> {
    async init() {
        this.requiredPermissions = [];
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [{ name: 'coin', type: 'string', required: true }]);

        const coinInfo = await getCoinInfo(payload.coin);
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
