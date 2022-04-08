// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/Fees.js

import BigNumber from 'bignumber.js';
import { Blockchain } from '../../backend/BlockchainLink';
import type { BitcoinDefaultFeesKeys, CoinInfo } from '../../types';
import type { FeeLevel } from '../../types/account';

type Blocks = Array<string | undefined>;
// this is workaround for the lack of information from 'trezor-common'
// we need to declare what does "high/normal/low" mean in block time (eg: normal BTC = 6 blocks = ~1 hour)
// coins other than BTC usually got 2 levels maximum (high/low) and we should consider to remove other levels from 'trezor-common'

const BLOCKS: Record<string, Record<string, number>> = {
    btc: {
        // blocktime ~ 600sec.
        high: 1,
        normal: 6,
        economy: 36,
        low: 144,
    },
    bch: {
        // blocktime ~ 600sec.
        high: 1,
        normal: 5,
        economy: 10,
        low: 10,
    },
    btg: {
        // blocktime ~ 600sec.
        high: 1,
        normal: 5,
        economy: 10,
        low: 10,
    },
    dgb: {
        // blocktime ~ 20sec.
        high: 1,
        normal: 15,
        economy: 30,
        low: 60,
    },
};

const getDefaultBlocks = (shortcut: string, label: string) =>
    BLOCKS[shortcut] && BLOCKS[shortcut][label] ? BLOCKS[shortcut][label] : -1; // -1 for unknown

const feePerKB = (fee: string) => {
    const bn = new BigNumber(fee);
    if (bn.isNaN() || bn.lte('0')) return;
    return bn.div(1000).integerValue(BigNumber.ROUND_HALF_CEIL).toString();
    // return bn.toString();
};

const fillGap = (from: number, step: number, size: number) => {
    const fill: number[] = [];
    for (let i = from + step; i <= from + size; i += step) {
        fill.push(i);
    }
    return fill;
};

const findLowest = (blocks: Blocks) => {
    const unique: string[] = [];
    blocks.forEach(item => {
        if (typeof item === 'string' && unique.indexOf(item) < 0) {
            unique.push(item);
        }
    });
    return unique[unique.length - 1];
};

const findNearest = (requested: number, blocks: Blocks) => {
    const len = blocks.length;
    const knownValue = blocks[requested];
    // return first occurrence of requested block value
    if (typeof knownValue === 'string') return knownValue;
    const lastKnownValue = blocks
        .slice()
        .reverse()
        .find(item => typeof item === 'string');
    if (!lastKnownValue) return;
    const lastKnownIndex = blocks.indexOf(lastKnownValue);
    // there is no information for this block entry
    if (requested >= lastKnownIndex) {
        // requested block is greater than known range
        // return first occurrence of the lowest known fee
        return lastKnownValue;
    }

    // try to find nearest lower value
    let index = requested;
    while (typeof blocks[index] !== 'string' && index < len) {
        index++;
    }
    return blocks[index];
};

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

    blocks: Blocks = [];

    constructor(coinInfo: CoinInfo) {
        this.coinInfo = coinInfo;
        const shortcut = coinInfo.shortcut.toLowerCase();

        if (coinInfo.type === 'ethereum') {
            // TODO: https://github.com/trezor/trezor-suite/issues/5340
            // unlike the others, ethereum got additional value "feeLimit" in coinInfo (Gas limit)
            this.levels = coinInfo.defaultFees.map(level => ({
                ...level,
                blocks: -1, // blocks unknown
            }));
            return;
        }

        // sort fee levels from coinInfo
        // and transform in to FeeLevel object
        const keys = Object.keys(coinInfo.defaultFees) as BitcoinDefaultFeesKeys[];
        this.levels = keys
            .sort((levelA, levelB) => coinInfo.defaultFees[levelB] - coinInfo.defaultFees[levelA])
            .map(level => {
                const label: any = level.toLowerCase(); // string !== 'high' | 'normal'....
                const blocks = getDefaultBlocks(shortcut, label); // TODO: get this value from trezor-common
                return {
                    label,
                    feePerUnit: coinInfo.defaultFees[level].toString(),
                    blocks,
                };
            });
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

        try {
            const response = await blockchain.estimateFee({ blocks });
            response.forEach((r, i) => {
                this.blocks[blocks[i]] = feePerKB(r.feePerUnit);
            });
            if (this.levels.length === 1) {
                const lowest = findLowest(this.blocks);
                if (typeof lowest === 'string') {
                    this.levels[0].blocks = this.blocks.indexOf(lowest);
                    this.levels[0].feePerUnit = lowest;
                }
            } else {
                this.levels.forEach(l => {
                    const updatedValue = findNearest(l.blocks, this.blocks);
                    if (typeof updatedValue === 'string') {
                        l.blocks = this.blocks.indexOf(updatedValue);
                        l.feePerUnit = updatedValue;
                    }
                });
            }
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
