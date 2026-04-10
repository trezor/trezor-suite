// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/blockchain/BlockchainGetTransactions.js

import type { CoinInfo } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type { MethodContext, MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams } from './common/paramsValidator';
import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { getCoinInfo } from '../data/coinInfo';

type Params = {
    txs: string[];
    coinInfo: CoinInfo;
    identity?: string;
};

export default class BlockchainGetTransactions extends AbstractMethod<
    'blockchainGetTransactions',
    Params
> {
    constructor(message: MethodMessage<'blockchainGetTransactions'>) {
        const { payload } = message;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'txs', type: 'array', required: true },
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
        ]);

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        const params = {
            txs: payload.txs,
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

    init() {}

    async run({ sendCoreMessage }: MethodContext) {
        const backend = await initBlockchain(
            this.params.coinInfo,
            sendCoreMessage,
            this.params.identity,
        );

        return backend.getTransactions(this.params.txs);
    }
}
