// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainSubscribe.js

import { TrezorBlockchain } from '@trezor/blockchain-core';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    accounts: Payload<'blockchainSubscribe'>['accounts'];
    blocks: boolean;
    coinInfo: CoinInfo;
    identity?: string;
};

export default class BlockchainSubscribe extends AbstractBlockchainMethod<
    'blockchainSubscribe',
    Params
> {
    constructor(message: MethodMessage<'blockchainSubscribe'>) {
        const { payload } = message;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'accounts', type: 'array', allowEmpty: true },
            { name: 'blocks', type: 'boolean' },
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
        ]);

        if (payload.accounts) {
            payload.accounts.forEach(account => {
                validateParams(account, [{ name: 'descriptor', type: 'string', required: true }]);
            });
        }

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        const params = {
            accounts: payload.accounts,
            blocks: payload.blocks ?? true, // default is true because of backwards compatibility
            coinInfo,
            identity: payload.identity,
        };

        super(message, params);
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'internal' }];
    }

    run() {
        return this.callBlockchain(TrezorBlockchain.subscribe(this.payload));
    }
}
