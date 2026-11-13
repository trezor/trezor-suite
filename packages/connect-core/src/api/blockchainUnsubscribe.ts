// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainUnsubscribe.js

import { unsubscribe } from '@trezor/blockchain-core/src/api/subscribe';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { validateParams } from './common/paramsValidator';
import type { MethodContext, MethodMessage, Payload } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    accounts: Payload<'blockchainUnsubscribe'>['accounts'];
    coinInfo: CoinInfo;
    identity?: string;
    blocks: boolean;
};

export default class BlockchainUnsubscribe extends AbstractBlockchainMethod<
    'blockchainUnsubscribe',
    Params
> {
    constructor(message: MethodMessage<'blockchainUnsubscribe'>) {
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
            coinInfo,
            identity: payload.identity,
            blocks: payload.blocks ?? false,
        };

        super(message, params);
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'internal' }];
    }

    run({ sendCoreMessage }: MethodContext) {
        return unsubscribe(this.payload, sendCoreMessage);
    }
}
