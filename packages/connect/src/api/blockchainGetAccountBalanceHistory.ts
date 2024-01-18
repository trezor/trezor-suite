// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetAccountBalanceHistory.js

import { Payload, AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { ERRORS } from '../constants';
import { isBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';
import type { CoinInfo } from '../types';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    request: Omit<Payload<'blockchainGetAccountBalanceHistory'>, 'method' | 'coin'>;
};

export default class BlockchainGetAccountBalanceHistory extends AbstractMethod<
    'blockchainGetAccountBalanceHistory',
    Params
> {
    init() {
        this.useDevice = false;
        this.useUi = false;

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
            { name: 'descriptor', type: 'string', required: true },
            { name: 'from', type: 'number' },
            { name: 'to', type: 'number' },
            { name: 'groupBy', type: 'number' },
        ]);

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        this.params = {
            coinInfo,
            identity: payload.identity,
            request: {
                descriptor: payload.descriptor,
                from: payload.from,
                to: payload.to,
                groupBy: payload.groupBy,
            },
        };
    }

    async run() {
        const backend = await initBlockchain(
            this.params.coinInfo,
            this.postMessage,
            this.params.identity,
        );

        return backend.getAccountBalanceHistory(this.params.request);
    }
}
