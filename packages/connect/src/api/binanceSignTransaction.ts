// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/BinanceSignTransaction.js

import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import { getMiscNetwork } from '../data/CoinInfo';
import { validatePath } from '../utils/pathUtils';
import * as helper from './binance/binanceSignTx';

import type { BinancePreparedTransaction } from '../types/api/binanceSignTransaction';

type Params = {
    path: number[];
    transaction: BinancePreparedTransaction;
};

export default class BinanceSignTransaction extends AbstractMethod<'binanceSignTransaction'> {
    params: Params;

    init() {
        this.requiredPermissions = ['read', 'write'];
        this.firmwareRange = getFirmwareRange(this.name, getMiscNetwork('BNB'), this.firmwareRange);
        this.info = 'Sign Binance transaction';

        const { payload } = this;
        // validate incoming parameters
        validateParams(payload, [
            { name: 'path', type: 'string', required: true },
            { name: 'transaction', required: true },
        ]);

        const path = validatePath(payload.path, 3);
        const transaction = helper.validate(payload.transaction);

        this.params = {
            path,
            transaction,
        };
    }

    run() {
        return helper.signTx(
            this.device.getCommands().typedCall.bind(this.device.getCommands()),
            this.params.path,
            this.params.transaction,
        );
    }
}
