// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/Fees.js

import { BigNumber } from '@trezor/utils/src/bigNumber';

import type { BitcoinNetworkInfo } from '../../types';
import { Blockchain } from '../Blockchain';
import { Blocks, MiscFeeLevels } from './MiscFeeLevels';

const findBlocksForFee = (feePerUnit: string, blocks: Blocks) => {
    const fee = new BigNumber(feePerUnit);
    // find first occurrence of value lower or equal than requested
    const lower = blocks.find(block => typeof block === 'string' && fee.gte(block));
    if (!lower) return -1;

    // if not found get latest know value
    return blocks.indexOf(lower);
};

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

export class BitcoinFeeLevels extends MiscFeeLevels {
    coinInfo: BitcoinNetworkInfo;

    longTermFeeRate?: string; // long term fee rate is used by @trezor/utxo-lib composeTx module

    blocks: Blocks = [];

    // override only to narrow down the coinInfo type
    constructor(coinInfo: BitcoinNetworkInfo) {
        super(coinInfo);
        this.coinInfo = coinInfo;
    }

    async load(blockchain: Blockchain) {
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
                this.blocks[blocks[index]] = convertFeeRate(
                    feePerUnit || '0',
                    this.coinInfo.minFee,
                );
            });

            this.levels.forEach(level => {
                const updatedValue = findNearest(level.blocks, this.blocks);
                if (typeof updatedValue === 'string') {
                    level.blocks = this.blocks.indexOf(updatedValue);
                    level.feePerUnit = updatedValue;
                }
            });

            this.longTermFeeRate = findLowest(this.blocks);
            this.wasFetchedSuccessfully = true;
        } catch {
            // do not throw
        }

        return this.levels;
    }

    updateBitcoinCustomFee(feePerUnit: string) {
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
