// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainSetCustomBackend.js

import type { CoinInfo } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { reconnectAllBackends, setCustomBackend } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
};

export default class BlockchainSetCustomBackend extends AbstractMethod<
    'blockchainSetCustomBackend',
    Params
> {
    constructor(message: MethodMessage<'blockchainSetCustomBackend'>) {
        const { payload } = message;

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

        const params = { coinInfo };

        super(message, params);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    get info() {
        return '';
    }

    async run() {
        await reconnectAllBackends(this.params.coinInfo);

        return true;
    }
}
