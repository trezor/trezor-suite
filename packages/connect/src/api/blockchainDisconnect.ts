// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainDisconnect.js

import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import { findBackend, isBackendSupported } from '../backend/BlockchainLink';
import { AbstractMethod, MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';
import { CoinInfo, CoinObj } from '../types';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
};

export default class BlockchainDisconnect extends AbstractMethod<'blockchainDisconnect', Params> {
    constructor(message: MethodMessage<'blockchainDisconnect'>) {
        super(message);

        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): MethodPermission[] {
        return [];
    }

    init() {
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
            identity: payload.identity,
        };
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
