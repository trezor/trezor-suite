// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainUnsubscribe.js

import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodContext, MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { assertBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    accounts: Payload<'blockchainUnsubscribe'>['accounts'];
    coinInfo: CoinInfo;
    identity?: string;
    blocks: boolean;
};

export default class BlockchainUnsubscribe extends AbstractMethod<'blockchainUnsubscribe', Params> {
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
        // validate backend
        assertBackendSupported(coinInfo);

        const params = {
            accounts: payload.accounts,
            coinInfo,
            identity: payload.identity,
            blocks: payload.blocks ?? false,
        };

        super(message, params);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'internal' }];
    }

    async run({ sendCoreMessage }: MethodContext) {
        const backend = await initBlockchain(
            this.params.coinInfo,
            sendCoreMessage,
            this.params.identity,
        );

        const { accounts } = this.params;

        if (this.params.blocks) {
            return backend.unsubscribeBlocks();
        }
        if (accounts) {
            return backend.unsubscribeAccounts(accounts);
        }

        return backend.unsubscribeAll();
    }
}
