// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainDisconnect.js

import type { CoinInfo } from '@trezor/connect-common';
import { CoinObj } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import { findBackend, isBackendSupported } from '../backend/BlockchainLink';
import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
};

export default class BlockchainDisconnect extends AbstractMethod<'blockchainDisconnect', Params> {
    constructor(message: MethodMessage<'blockchainDisconnect'>) {
        const { payload } = message;

        // validate incoming parameters
        Assert(CoinObj, payload);

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        const params = {
            coinInfo,
            identity: payload.identity,
        };

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

    run() {
        const backend = findBackend(this.params.coinInfo.shortcut, this.params.identity);
        backend?.disconnect();

        return Promise.resolve({ disconnected: true });
    }
}
