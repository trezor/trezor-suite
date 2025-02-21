// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/Fees.js

import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Blockchain } from '../../backend/BlockchainLink';
import type { CoinInfo, FeeLevel } from '../../types';

export type Blocks = Array<string | undefined>;

export const findBlocksForFee = (feePerUnit: string, blocks: Blocks) => {
    const bn = new BigNumber(feePerUnit);
    // find first occurrence of value lower or equal than requested
    const lower = blocks.find(b => typeof b === 'string' && bn.gte(b));
    if (!lower) return -1;

    // if not found get latest know value
    return blocks.indexOf(lower);
};

export class MiscFeeLevels {
    coinInfo: CoinInfo;

    levels: FeeLevel[];
    longTermFeeRate?: string; // long term fee rate is used by @trezor/utxo-lib composeTx module

    blocks: Blocks = [];

    constructor(coinInfo: CoinInfo) {
        this.coinInfo = coinInfo;
        this.levels = coinInfo.defaultFees;
    }

    async load(blockchain: Blockchain) {
        try {
            const [response] = await blockchain.estimateFee({ blocks: [1] });

            //misc coins should have only one FeeLevel (normal)
            this.levels[0] = {
                ...this.levels[0],
                ...response,
                // validate `feePerUnit` from the backend
                // should be lower than `coinInfo.maxFee` and higher than `coinInfo.minFee`
                // xrp sends values from 1 to very high number occasionally
                // see: https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/ripple/index.ts#L316
                feePerUnit: Math.min(
                    this.coinInfo.maxFee,
                    Math.max(this.coinInfo.minFee, parseInt(response.feePerUnit ?? '0', 10)),
                ).toString(),
            };
        } catch {
            // silent
        }

        return this.levels;
    }

    updateCustomFee(feePerUnit: string) {
        // remove "custom" level from list
        this.levels = this.levels.filter(l => l.label !== 'custom');
        // recreate "custom" level
        const blocks = findBlocksForFee(feePerUnit, this.blocks);
        this.levels.push({
            label: 'custom',
            feePerUnit,
            blocks,
        });
    }
}
