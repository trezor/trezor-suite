// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/PushTransaction.js

import { pushTransaction } from '@trezor/blockchain-core/src/api/pushTransaction';
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';
import { PushTransaction as PushTransactionSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodContext, MethodMessage } from '../core/AbstractMethod';
import { AbstractBlockchainMethod } from './common/AbstractBlockchainMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    tx: PushTransactionSchema['tx'];
    coinInfo: CoinInfo;
    identity?: string;
};

export default class PushTransaction extends AbstractBlockchainMethod<'pushTransaction', Params> {
    constructor(message: MethodMessage<'pushTransaction'>) {
        const { payload } = message;

        // validate incoming parameters
        Assert(PushTransactionSchema, payload);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

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
    }
    get requiredPermissions(): PermissionRequest[] {
        return [this.coinPerm('push_tx', this.params.coinInfo)];
    }

    run({ sendCoreMessage }: MethodContext) {
        return pushTransaction(this.payload, sendCoreMessage);
    }
}
