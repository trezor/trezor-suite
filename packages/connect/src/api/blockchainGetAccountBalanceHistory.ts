// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetAccountBalanceHistory.js

import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';

import type { MethodContext, MethodMessage, Payload } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { getCoinInfoOrThrow } from '../data/coinInfo';

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
        const { payload } = message;

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

        const coinInfo = getCoinInfoOrThrow(payload.coin);
        // validate backend
        isBackendSupported(coinInfo);

        const params = {
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

        super(message, params);
        this.useDevice = false;
        this.useUi = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [];
    }

    async run({ sendCoreMessage }: MethodContext) {
        const backend = await initBlockchain(
            this.params.coinInfo,
            sendCoreMessage,
            this.params.identity,
        );

        return backend.getAccountBalanceHistory(this.params.request);
    }
}
