// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/Fees.js

import { BigNumber } from '@trezor/utils/src/bigNumber';

import type { BitcoinNetworkInfo } from '../../types';
import { Blockchain } from '../Blockchain';
import { MiscFeeLevels } from './MiscFeeLevels';
import { DEFAULT_BITCOIN_LONGTERM_FEE_RATE } from '../../data/defaultFeeLevels';

export class BitcoinFeeLevels extends MiscFeeLevels {
    coinInfo: BitcoinNetworkInfo;
    longTermFeeRate: string; // long term fee rate is used by @trezor/utxo-lib composeTx module

    // override only to narrow down the coinInfo type
    constructor(coinInfo: BitcoinNetworkInfo) {
        super(coinInfo);
        this.coinInfo = coinInfo;
        // TODO https://github.com/trezor/trezor-suite/issues/18483 rewrite with response from a new planned blockbook API
        this.longTermFeeRate = DEFAULT_BITCOIN_LONGTERM_FEE_RATE;
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

                const trimmedFeePerUnit = Math.min(maxFee, Math.max(minFee, feePerB));
                this.levels[index].feePerUnit = trimmedFeePerUnit.toString();
            });
            this.wasFetchedSuccessfully = true;
        } catch {
            // do not throw, just keep current fee levels
        }

        return this.levels;
    }

    updateBitcoinCustomFee(feePerUnit: string) {
        this.levels = this.levels.filter(l => l.label !== 'custom');
        this.levels.push({
            label: 'custom',
            feePerUnit,
            /*
             We do not estimate confirmation time for custom fees. It could be interpolated if we had
             an array of historical fee rates, but not with the mempool.space API that blockbook provides.
             That data, although great for estimating low/normal/high fees, means something completely different.
            */
            blocks: -1,
        });
    }
}
