// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/PushTransaction.js

import type { CoinInfo } from '@trezor/connect-common';
import { PushTransaction as PushTransactionSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import type { MethodContext, MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';

type Params = {
    tx: PushTransactionSchema['tx'];
    coinInfo: CoinInfo;
    identity?: string;
};

export default class PushTransaction extends AbstractMethod<'pushTransaction', Params> {
    constructor(message: MethodMessage<'pushTransaction'>) {
        const { payload } = message;

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

        const params = {
            tx: payload.tx,
            coinInfo,
            identity: payload.identity,
        };

        super(message, params);
        this.useUi = false;
        this.useDevice = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['push_tx'];
    }

    async run({ sendCoreMessage }: MethodContext) {
        const backend = await initBlockchain(
            this.params.coinInfo,
            sendCoreMessage,
            this.params.identity,
        );
        const txid = await backend.pushTransaction(this.params.tx);

        return {
            txid,
        };
    }
}
