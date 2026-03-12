// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/PushTransaction.js

import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { AbstractMethod, MethodContext, MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';
import type { CoinInfo } from '../types';
import { PushTransaction as PushTransactionSchema } from '../types/api/pushTransaction';

type Params = {
    tx: PushTransactionSchema['tx'];
    coinInfo: CoinInfo;
    identity?: string;
};

export default class PushTransaction extends AbstractMethod<'pushTransaction', Params> {
    constructor(message: MethodMessage<'pushTransaction'>, context: MethodContext) {
        super(message, context);
        this.useUi = false;
        this.useDevice = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['push_tx'];
    }

    init() {
        const { payload } = this;

        // validate incoming parameters
        Assert(PushTransactionSchema, payload);

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        if (
            coinInfo.type === 'bitcoin' &&
            (typeof payload.tx !== 'string' || !/^[0-9A-Fa-f]*$/.test(payload.tx))
        ) {
            throw ERRORS.TypedError('Method_InvalidParameter', 'Transaction must be hexadecimal');
        }

        this.params = {
            tx: payload.tx,
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
        const txid = await backend.pushTransaction(this.params.tx);

        return {
            txid,
        };
    }
}
