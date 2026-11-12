// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainDisconnect.js

import { TrezorBlockchain } from '@trezor/blockchain-core';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';
import { CoinObj } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
};

export default class BlockchainDisconnect extends AbstractBlockchainMethod<
    'blockchainDisconnect',
    Params
> {
    constructor(message: MethodMessage<'blockchainDisconnect'>) {
        const { payload } = message;

        // validate incoming parameters
        Assert(CoinObj, payload);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const params = {
            coinInfo,
            identity: payload.identity,
        };

        super(message, params);
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'internal' }];
    }

    run() {
        return this.callBlockchain(TrezorBlockchain.disconnect(this.payload));
    }
}
