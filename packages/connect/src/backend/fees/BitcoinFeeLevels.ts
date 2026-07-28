// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/Fees.js

import type { BitcoinNetworkInfo } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { clamp } from '@trezor/utils/src/number';

import type { Blockchain } from '../Blockchain';
import { MiscFeeLevels } from './MiscFeeLevels';

export class BitcoinFeeLevels extends MiscFeeLevels {
    coinInfo: BitcoinNetworkInfo;

    // override only to narrow down the coinInfo type
    constructor(coinInfo: BitcoinNetworkInfo) {
        super(coinInfo);
        this.coinInfo = coinInfo;
    }

    async load(blockchain: Blockchain) {
        try {
            const { minFee, maxFee } = this.coinInfo;
            // get numbers of blocks to be requested, filter out 'custom' if present (the last one)
            const blocks = this.levels.map(level => level.blocks).filter(b => b > 0);
            const response = await blockchain.estimateFee({ blocks });

            response.forEach(({ feePerUnit: feePerKB }, index) => {
                // for bitcoin-like coins, blockbook websocket API returns sat/kB by default
                const feePerB = new BigNumber(feePerKB).div(1000).toNumber();

                // in case of invalid blockbook response, keep the previous or default data
                if (isNaN(feePerB) || feePerB < 0) return;

                const trimmedFeePerUnit = clamp(feePerB, minFee, maxFee);
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const level: (typeof this.levels)[number] = this.levels[index];
                level.feePerUnit = trimmedFeePerUnit.toString();
            });
        } catch {
            // do not throw, just keep current fee levels
        }

        return this.levels;
    }
}
