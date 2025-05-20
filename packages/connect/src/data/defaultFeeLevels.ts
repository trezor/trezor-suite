import { BigNumber, typedObjectKeys } from '@trezor/utils';

import { FeeInfo, FeeLevel } from '../types';

// this is workaround for the lack of information from 'trezor-common'
// we need to declare what does "high/normal/low" mean in block time (eg: normal BTC = 6 blocks = ~1 hour)
// coins other than BTC usually got 2 levels maximum (high/low) and we should consider to remove other levels from 'trezor-common'
const BLOCKS_FOR_FEE_LEVEL: Record<string, Record<string, number>> = {
    btc: {
        // blocktime ~ 600sec.
        high: 1,
        normal: 3,
        economy: 12,
        // low fee is offerred by Connect, though Suite only uses the first three levels (see feesThunks.ts)
        low: 36,
    },
};

const getDefaultBlocksForFeeLevel = (shortcut: string, label: string) =>
    BLOCKS_FOR_FEE_LEVEL[shortcut] && BLOCKS_FOR_FEE_LEVEL[shortcut][label]
        ? BLOCKS_FOR_FEE_LEVEL[shortcut][label]
        : -1; // -1 for unknown

// TODO: valid only for legacy, extend for EIP-1559?
const EVM_GAS_PRICE_PER_CHAIN_IN_GWEI: Record<
    string,
    { min: number; max: number; defaultGas: number }
> = {
    eth: { min: 0.1, max: 10000, defaultGas: 10 },
    pol: { min: 0.1, max: 10000000, defaultGas: 200 },
    bsc: { min: 0.1, max: 100000, defaultGas: 1 },
    base: { min: 0.0000001, max: 1000, defaultGas: 0.01 },
    arb: { min: 0.001, max: 1000, defaultGas: 0.01 },
    op: { min: 0.000000001, max: 1000, defaultGas: 0.01 },
};

const getEvmChainGweiGasPrice = (chain: string) =>
    EVM_GAS_PRICE_PER_CHAIN_IN_GWEI[chain] ?? {
        min: 0.000000001,
        max: 10000,
        defaultGas: 1,
    };

// partial data from coins.jon
interface CoinsJsonData {
    shortcut: string; // uppercase shortcut
    blocktime_seconds: number;
    // data below are defined and relevant only for bitcoin-like networks
    default_fee_b: Record<'High' | 'Normal' | 'Economy' | 'Low', number>;
    maxfee_kb: number;
    minfee_kb: number;
    dust_limit: number;
    // only for evm networks
    chain: string;
}

export type FeeInfoWithLevels = FeeInfo & { defaultFees: FeeLevel[] };

export const getBitcoinFeeLevels = (coin: CoinsJsonData): FeeInfoWithLevels => {
    // sort fee levels from coinInfo
    // and transform in to FeeLevel object
    const defaultFees = coin.default_fee_b;
    const shortcut = coin.shortcut.toLowerCase();
    const keys = typedObjectKeys(defaultFees);
    const levels = keys
        .sort((levelA, levelB) => defaultFees[levelB] - defaultFees[levelA])
        .map(level => {
            const label = level.toLowerCase() as FeeLevel['label']; // string !== 'high' | 'normal'....

            return {
                label,
                feePerUnit: defaultFees[level].toString(),
                blocks: getDefaultBlocksForFeeLevel(shortcut, label),
            };
        });

    return {
        blockTime: Math.max(1, Math.round(coin.blocktime_seconds / 60)),
        dustLimit: coin.dust_limit,
        maxFee: Math.round(coin.maxfee_kb / 1000),
        minFee: Math.round(coin.minfee_kb / 1000),
        defaultFees: levels,
    };
};

export const getEthereumFeeLevels = (network: CoinsJsonData): FeeInfoWithLevels => {
    const { min, max, defaultGas } = getEvmChainGweiGasPrice(network.chain);

    return {
        blockTime: -1, // unknown
        defaultFees: [
            {
                label: 'normal' as const,
                feePerUnit: new BigNumber(defaultGas).multipliedBy('1e+9').toString(), // defined in wei 1 Gwei = 10^9 Wei
                feeLimit: '21000', // default transfer gas limit
                blocks: -1, // unknown
            },
        ],
        minFee: min,
        maxFee: max,
        dustLimit: -1, // unknown/unused
    };
};

const RIPPLE_FEE_INFO: FeeInfoWithLevels = {
    blockTime: -1, // unknown
    defaultFees: [{ label: 'normal', feePerUnit: '12', blocks: -1 }],
    minFee: 10,
    maxFee: 10000,
    dustLimit: -1, // unknown/unused
};

const CARDANO_FEE_INFO: FeeInfoWithLevels = {
    blockTime: -1, // unknown
    defaultFees: [{ label: 'normal', feePerUnit: '44', blocks: -1 }],
    minFee: 44,
    maxFee: 16384 * 44 + 155381,
    dustLimit: -1, // unknown/unused
};

const SOLANA_FEE_INFO: FeeInfoWithLevels = {
    blockTime: -1, // unknown
    // feePerUnit is used as feePerSignature on Solana as the fee depends on the number
    // of signature rather than the size of the transaction.
    defaultFees: [
        {
            label: 'normal',
            feePerUnit: '100000',
            feeLimit: '200000',
            feePerTx: '25000',
            blocks: -1,
        },
    ],
    minFee: 5000,
    maxFee: 1000000000,
    dustLimit: -1, // unknown/unused
};

const STELLAR_FEE_INFO: FeeInfoWithLevels = {
    blockTime: -1, // unknown
    defaultFees: [{ label: 'normal', feePerUnit: '100', blocks: -1 }],
    minFee: 100, // 0.00001 XLM
    maxFee: 10000000, // 1 XLM
    dustLimit: -1, // unknown/unused
};

const MISC_FEE_LEVELS: Record<string, FeeInfoWithLevels> = {
    xrp: RIPPLE_FEE_INFO,
    txrp: RIPPLE_FEE_INFO,
    ada: CARDANO_FEE_INFO,
    tada: CARDANO_FEE_INFO,
    sol: SOLANA_FEE_INFO,
    dsol: SOLANA_FEE_INFO,
    xlm: STELLAR_FEE_INFO,
    txlm: STELLAR_FEE_INFO,
};

export const getMiscFeeLevels = (data: CoinsJsonData): FeeInfoWithLevels => {
    const shortcut = data.shortcut.toLowerCase();

    return (
        MISC_FEE_LEVELS[shortcut] || {
            blockTime: -1,
            minFee: -1,
            maxFee: -1,
            defaultFees: [{ label: 'normal', feePerUnit: '-1', blocks: -1 }],
            dustLimit: -1,
        }
    );
};
