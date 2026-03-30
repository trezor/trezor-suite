// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetAccountBalanceHistory.js

import type { CoinInfo } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type { MethodMessage, MethodPermission, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';

type Params = {
    coinInfo: CoinInfo;
    identity?: string;
    request: Omit<Payload<'blockchainGetAccountBalanceHistory'>, 'method' | 'coin'>;
};

export default class BlockchainGetAccountBalanceHistory extends AbstractMethod<
    'blockchainGetAccountBalanceHistory',
    Params
> {
    constructor(message: MethodMessage<'blockchainGetAccountBalanceHistory'>) {
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
        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
            { name: 'descriptor', type: 'string', required: true },
            { name: 'from', type: 'number' },
            { name: 'to', type: 'number' },
            { name: 'groupBy', type: 'number' },
            { name: 'currencies', type: 'array' },
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
                currencies: payload.currencies,
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
