// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/Fees.js

import BigNumber from 'bignumber.js';
import { Blockchain } from '../../backend/BlockchainLink';
import type { CoinInfo, FeeLevel } from '../../types';

type Blocks = Array<string | undefined>;

const convertFeeRate = (fee: string, minFee: number) => {
    const feePerKB = new BigNumber(fee);
    if (feePerKB.isNaN() || feePerKB.lte('0')) return;
    const feePerB = feePerKB.div(1000);
    if (feePerB.lt(minFee)) return minFee.toString();

    return feePerB.isInteger() ? feePerB.toString() : feePerB.toFixed(2);
};

const fillGap = (from: number, step: number, size: number) => {
    const fill: number[] = [];
    for (let i = from + step; i <= from + size; i += step) {
        fill.push(i);
    }

    return fill;
};

const findNearest = (requested: number, blocks: Blocks) => {
    // found exact requested value
    if (typeof blocks[requested] === 'string') return blocks[requested];

    // exact value for requested block is unknown?
    // walk forward through blocks and try to find first known value
    const len = blocks.length;
    let index = requested;
    while (typeof blocks[index] !== 'string' && index < len) {
        index++;
    }
    // found something useful
    if (typeof blocks[index] === 'string') {
        return blocks[index];
    }
    // didn't find anything while looking forward? then try to walk backward
    index = requested;
    while (typeof blocks[index] !== 'string' && index > 0) {
        index--;
    }

    // return something or undefined
    return blocks[index];
};

const findLowest = (blocks: Blocks) =>
    blocks
        .slice(0)
        .reverse()
        .find(item => typeof item === 'string');

const findBlocksForFee = (feePerUnit: string, blocks: Blocks) => {
    const bn = new BigNumber(feePerUnit);
    // find first occurrence of value lower or equal than requested
    const lower = blocks.find(b => typeof b === 'string' && bn.gte(b));
    if (!lower) return -1;

    // if not found get latest know value
    return blocks.indexOf(lower);
};

export class FeeLevels {
    coinInfo: CoinInfo;

    levels: FeeLevel[];
    longTermFeeRate?: string; // long term fee rate is used by @trezor/utxo-lib composeTx module

    blocks: Blocks = [];

    constructor(coinInfo: CoinInfo) {
        this.coinInfo = coinInfo;
        this.levels = coinInfo.defaultFees;
    }

    async loadMisc(blockchain: Blockchain) {
        try {
            const [response] = await blockchain.estimateFee({ blocks: [1] });
            // misc coins should have only one FeeLevel (normal)
            this.levels[0] = {
                ...this.levels[0],
                ...response,
                // validate `feePerUnit` from the backend
                // should be lower than `coinInfo.maxFee` and higher than `coinInfo.minFee`
                // xrp sends values from 1 to very high number occasionally
                // see: https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/ripple/index.ts#L316
                feePerUnit: Math.min(
                    this.coinInfo.maxFee,
                    Math.max(this.coinInfo.minFee, parseInt(response.feePerUnit, 10)),
                ).toString(),
            };
        } catch (error) {
            // silent
        }

        return this.levels;
    }

    async load(blockchain: Blockchain) {
        if (this.coinInfo.type !== 'bitcoin') return this.loadMisc(blockchain);
        // only for bitcoin-like

        let blocks = fillGap(0, 1, 10);
        if (this.levels.length > 1) {
            // multiple levels
            blocks = this.levels
                .map(l => l.blocks)
                .reduce((result: number[], bl: number) => {
                    // return first value
                    if (result.length === 0) return result.concat([bl]);
                    // get previous block request
                    const from = result[result.length - 1];
                    // calculate gap between previous and current
                    const gap = bl - from;
                    // if gap is lower than 30 blocks (normal and economy)
                    // fill every block in range
                    // otherwise fill every 6th block (1h)
                    const incr = gap <= 30 ? 1 : 6;
                    const fill = fillGap(from, incr, gap);

                    // add to result
                    return result.concat(fill);
                }, []);
        }
        // add more blocks to the request to find `longTermFee`
        const oneDayBlocks = 6 * 24; // maximum value accepted by backends is usually 1008 - 7 days (6 * 24 * 7)
        blocks.push(...fillGap(oneDayBlocks, oneDayBlocks / 2, oneDayBlocks * 6));

        try {
            const response = await blockchain.estimateFee({ blocks });
            response.forEach(({ feePerUnit }, index) => {
                this.blocks[blocks[index]] = convertFeeRate(feePerUnit, this.coinInfo.minFee);
            });

            this.levels.forEach(level => {
                const updatedValue = findNearest(level.blocks, this.blocks);
                if (typeof updatedValue === 'string') {
                    level.blocks = this.blocks.indexOf(updatedValue);
                    level.feePerUnit = updatedValue;
                }
            });

            this.longTermFeeRate = findLowest(this.blocks);
        } catch (error) {
            // do not throw
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
