// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainSubscribe.js

import type { CoinInfo, MethodPermission } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type { MethodContext, MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';

type Params = {
    accounts: Payload<'blockchainSubscribe'>['accounts'];
    blocks: boolean;
    coinInfo: CoinInfo;
    identity?: string;
};

export default class BlockchainSubscribe extends AbstractMethod<'blockchainSubscribe', Params> {
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

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        const params = {
            accounts: payload.accounts,
            blocks: payload.blocks ?? true, // default is true because of backwards compatibility
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

    async run({ sendCoreMessage }: MethodContext) {
        const backend = await initBlockchain(
            this.params.coinInfo,
            sendCoreMessage,
            this.params.identity,
        );

        const { blocks, accounts } = this.params;

        let result = { subscribed: false };

        if (blocks) result = await backend.subscribeBlocks();
        if (accounts) result = await backend.subscribeAccounts(accounts);

        return result;
    }
}
