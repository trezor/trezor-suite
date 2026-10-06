// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/Fees.js

import type { BitcoinNetworkInfo, FeeLevel } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { cloneObject } from '@trezor/utils/src/cloneObject';
import { clamp } from '@trezor/utils/src/number';

import type { Blockchain } from '../Blockchain';
import type { FeeLevels } from './feeLevelsBase';

export class BitcoinFeeLevels implements FeeLevels {
    private coinInfo: BitcoinNetworkInfo;
    private feeLevels: FeeLevel[];

    get levels() {
        return this.feeLevels;
    }

    // override only to narrow down the coinInfo type
    constructor(coinInfo: BitcoinNetworkInfo) {
        this.coinInfo = coinInfo;
        this.feeLevels = cloneObject(coinInfo.defaultFees);
    }

    async load(blockchain: Blockchain) {
        try {
            const { minFee, maxFee } = this.coinInfo;
            // get numbers of blocks to be requested
            const blocks = this.feeLevels.map(level => level.blocks);
            const response = await blockchain.estimateFee({ blocks });

            response.forEach(({ feePerUnit: feePerKB }, index) => {
                // for bitcoin-like coins, blockbook websocket API returns sat/kB by default
                const feePerB = new BigNumber(feePerKB).div(1000).toNumber();

                // in case of invalid blockbook response, keep the previous or default data
                if (isNaN(feePerB) || feePerB < 0) return;

                const trimmedFeePerUnit = clamp(feePerB, minFee, maxFee);
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const level: (typeof this.feeLevels)[number] = this.feeLevels[index];
                level.feePerUnit = trimmedFeePerUnit.toString();
            });
        } catch {
            // do not throw, just keep current fee levels
        }
    }
}
