// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/BinanceSignTransaction.js

import { AbstractMethod } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import * as helper from '../binanceSignTx';
import { BinanceSignTransaction as BinanceSignTransactionSchema } from '../../../types/api/binance';
import { AssertWeak } from '@trezor/schema-utils';

import type { BinancePreparedTransaction } from '../../../types/api/binance';

type Params = {
    path: number[];
    transaction: BinancePreparedTransaction;
    chunkify?: boolean;
};

export default class BinanceSignTransaction extends AbstractMethod<
    'binanceSignTransaction',
    Params
> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.firmwareRange = getFirmwareRange(this.name, getMiscNetwork('BNB'), this.firmwareRange);

        const { payload } = this;
        // validate incoming parameters
        // TODO: weak assert for compatibility purposes (issue #10841)
        AssertWeak(BinanceSignTransactionSchema, payload);

        const path = validatePath(payload.path, 3);
        const transaction = helper.validate(payload.transaction);

        this.params = {
            path,
            transaction,
            chunkify: payload.chunkify ?? false,
        };
    }

    get info() {
        return 'Sign Binance transaction';
    }

    run() {
        return helper.signTx(
            this.device.getCommands().typedCall.bind(this.device.getCommands()),
            this.params.path,
            this.params.transaction,
            this.params.chunkify,
        );
    }
}
