// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainSetCustomBackend.js

import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { ERRORS } from '../constants';
import { setCustomBackend, reconnectAllBackends } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';
import type { CoinInfo } from '../types';

type Params = {
    coinInfo: CoinInfo;
};

export default class BlockchainSetCustomBackend extends AbstractMethod<
    'blockchainSetCustomBackend',
    Params
> {
    init() {
        this.requiredPermissions = [];
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'blockchainLink', type: 'object' },
        ]);

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }

        setCustomBackend(coinInfo, payload.blockchainLink);

        this.params = {
            coinInfo,
        };
    }

    get info() {
        return '';
    }

    async run() {
        await reconnectAllBackends(this.params.coinInfo);

        return true;
    }
}
