// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainSetCustomBackend.js

import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { reconnectAllBackends, setCustomBackend } from '../backend/BlockchainLink';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    blockchainLink?: {
        type: string;
        url: string[];
    };
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

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const { blockchainLink } = payload;

        const params = { coinInfo, blockchainLink };

        super(message, params);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'internal' }];
    }

    get info() {
        return '';
    }

    async run() {
        setCustomBackend(this.params.coinInfo, this.params.blockchainLink);

        await reconnectAllBackends(this.params.coinInfo);

        return true;
    }
}
