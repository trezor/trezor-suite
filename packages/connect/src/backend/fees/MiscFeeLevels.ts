// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/Fees.js

import type { CoinInfo, FeeLevel } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { cloneObject } from '@trezor/utils/src/cloneObject';

import type { Blockchain } from '../Blockchain';

export class MiscFeeLevels {
    coinInfo: CoinInfo;
    levels: FeeLevel[];
    // indicates that this.levels are current rates from backend, otherwise they are only the default values from jsons
    wasFetchedSuccessfully: boolean = false;

    constructor(coinInfo: CoinInfo) {
        this.coinInfo = coinInfo;
        this.levels = cloneObject(coinInfo.defaultFees);
    }

    async load(blockchain: Blockchain, request: Parameters<typeof blockchain.estimateFee>[0]) {
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

            // misc coins should have only one FeeLevel (normal)
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const currentLevel: (typeof this.levels)[number] = this.levels[0];
            this.levels[0] = {
                ...currentLevel,
                ...response,
                feePerUnit,
            };
            this.wasFetchedSuccessfully = true;
        } catch {
            // silent
        }

        return this.levels;
    }
}
