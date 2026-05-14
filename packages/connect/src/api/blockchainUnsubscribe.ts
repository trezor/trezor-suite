// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainUnsubscribe.js

import type { CoinInfo, MethodPermission } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type { MethodContext, MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';

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

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

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

    get requiredPermissions(): MethodPermission[] {
        return [];
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
