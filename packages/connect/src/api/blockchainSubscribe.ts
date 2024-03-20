// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainSubscribe.js

import { Payload, AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { ERRORS } from '../constants';
import { isBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';
import type { CoinInfo } from '../types';

type Params = {
    accounts: Payload<'blockchainSubscribe'>['accounts'];
    blocks: boolean;
    coinInfo: CoinInfo;
    identity?: string;
};

export default class BlockchainSubscribe extends AbstractMethod<'blockchainSubscribe', Params> {
    init() {
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

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

        this.params = {
            accounts: payload.accounts,
            blocks: payload.blocks ?? true, // default is true because of backwards compatibility
            coinInfo,
            identity: payload.identity,
        };
    }

    async run() {
        const backend = await initBlockchain(
            this.params.coinInfo,
            this.postMessage,
            this.params.identity,
        );

        const { blocks, accounts } = this.params;

        let result = { subscribed: false };

        if (blocks) result = await backend.subscribeBlocks();
        if (accounts) result = await backend.subscribeAccounts(accounts);

        return result;
    }
}
