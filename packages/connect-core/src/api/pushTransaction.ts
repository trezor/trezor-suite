// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/PushTransaction.js

import type { CoinInfo } from '@trezor/connect-common';
import { PushTransaction as PushTransactionSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

type Params = {
    tx: { hex: string; disableAlternativeRPC?: boolean };
    coinInfo: CoinInfo;
    identity?: string;
};

export default class PushTransaction extends AbstractMethod<'pushTransaction', Params> {
    constructor(message: MethodMessage<'pushTransaction'>) {
        const { payload } = message;

        // validate incoming parameters
        Assert(PushTransactionSchema, payload);

        const coinInfo = getCoinInfoOrThrow(payload.coin);

        if (coinInfo.type === 'bitcoin' && !/^[0-9A-Fa-f]*$/.test(payload.tx)) {
            throw ERRORS.TypedError('Method_InvalidParameter', 'Transaction must be hexadecimal');
        }

        const params = {
            tx: { hex: payload.tx, disableAlternativeRPC: payload.disableAlternativeRPC },
            coinInfo,
            identity: payload.identity,
        };

        super(message, params);
        this.useDevice = false;
    }

    // Broadcast by Trezor Suite's backends instead, see its pushTransaction popup flow.
    run() {
        return Promise.reject(
            ERRORS.TypedError(
                'Method_NotAllowed',
                'pushTransaction is available only through Trezor Suite',
            ),
        );
    }
}
