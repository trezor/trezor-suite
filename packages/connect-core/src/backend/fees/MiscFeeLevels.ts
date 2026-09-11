// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/Fees.js

import type { CoinInfo, FeeLevel } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { cloneObject } from '@trezor/utils/src/cloneObject';

import type { Blockchain } from '../Blockchain';
import type { FeeLevels } from './feeLevelsBase';

export class MiscFeeLevels implements FeeLevels {
    private coinInfo: CoinInfo;
    private level: FeeLevel;

    get levels() {
        return [this.level];
    }

    constructor(coinInfo: CoinInfo) {
        this.coinInfo = coinInfo;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess - misc coins should have only one FeeLevel (normal)
        this.level = cloneObject(coinInfo.defaultFees[0]);
    }

    async load(blockchain: Blockchain, request: Parameters<Blockchain['estimateFee']>[0]) {
        try {
            const estimateResult = await blockchain.estimateFee(request);
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const response: (typeof estimateResult)[number] = estimateResult[0];

            // validate `feePerUnit` from the backend
            // should be lower than `coinInfo.maxFee` and higher than `coinInfo.minFee`
            // xrp sends values from 1 to very high number occasionally
            // see: https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/ripple/index.ts#L316
            const fee = new BigNumber(response.feePerUnit).toNumber();

            const feePerUnit = Math.min(
                this.coinInfo.maxFee,
                Math.max(this.coinInfo.minFee, fee),
            ).toString();

            this.level = { ...this.level, ...response, feePerUnit };
        } catch {
            // silent
        }
    }
}
