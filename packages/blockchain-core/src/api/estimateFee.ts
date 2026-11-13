import type { BlockchainLinkParams, BlockchainLinkResponse } from '@trezor/blockchain-link';
import type { FeeLevel } from '@trezor/connect-common';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { isNotNull } from '@trezor/utils/src/isNotNull';
import { clamp } from '@trezor/utils/src/number';

import type { TrezorBlockchainResponse } from '../TrezorBlockchain';
import type { Blockchain, PostMessage } from '../backend/Blockchain';
import { assertBackendSupported, initCoinBackend } from '../backend/BlockchainLink';
import { type BackendCoinInfo, getBackendCoinInfo } from '../data/coinInfo';
import type { FeeInfo } from '../data/defaultFeeLevels';
import { COIN_PARAMS, type CoinParams, validateParams } from '../utils/validateParams';

type BackendLevelsParams = CoinParams & {
    request?: BlockchainLinkParams<'estimateFee'> & { feeLevels?: undefined };
};

type FeeLevelsParams = CoinParams & {
    request: BlockchainLinkParams<'estimateFee'> & { feeLevels: 'preloaded' | 'smart' };
};

export type EstimateFeeParams = BackendLevelsParams | FeeLevelsParams;

type EstimatedFee = Omit<FeeInfo, 'dustLimit'> & {
    dustLimit?: number; // dustLimit is set only for bitcoin-like coins
};

export type BlockchainEstimatedFee = EstimatedFee & {
    levels: BlockchainLinkResponse<'estimateFee'>;
};

export type BlockchainEstimatedFeeLevel = EstimatedFee & { levels: FeeLevel[] };

/** TrezorBlockchain.estimateFee, whose result depends on whether fee levels are requested. */
export type EstimateFeeMethod = {
    (params: BackendLevelsParams): TrezorBlockchainResponse<BlockchainEstimatedFee>;
    (params: FeeLevelsParams): TrezorBlockchainResponse<BlockchainEstimatedFeeLevel>;
};

type EstimateFeeRequest = Parameters<Blockchain['estimateFee']>[0];
type EstimatedFees = Awaited<ReturnType<Blockchain['estimateFee']>>;

// The last levels of each coin, returned for 'preloaded' and kept when the backend fails.
const lastLevels: { [shortcut: string]: FeeLevel[] } = {};

const gweiToWei = (gwei: number) => new BigNumber(gwei).multipliedBy('1e+9').toNumber();

// Used when the provider (e.g. 1inch) doesn't supply per-tier wait times. Values match typical
// EIP-1559 confirmation expectations.
const DEFAULT_EIP1559_BLOCKS = { low: 4, medium: 2, high: 1 } as const;

// For bitcoin-like coins, the blockbook websocket API returns sat/kB. A level without a valid
// estimate keeps its previous value.
const getBitcoinLevels = (
    { minFee, maxFee }: BackendCoinInfo,
    levels: FeeLevel[],
    estimatedFees: EstimatedFees,
) =>
    levels.map((level, index): FeeLevel => {
        const feePerB = new BigNumber(estimatedFees[index]?.feePerUnit ?? NaN).div(1000).toNumber();

        return isNaN(feePerB) || feePerB < 0
            ? level
            : { ...level, feePerUnit: clamp(feePerB, minFee, maxFee).toString() };
    });

const getEthereumLevels = (
    { minFee, maxFee, minPriorityFee, blockTime, defaultFees: [defaultLevel] }: BackendCoinInfo,
    [estimatedFee]: EstimatedFees,
): FeeLevel[] | undefined => {
    if (!estimatedFee || !defaultLevel) return;

    const minFeeInWei = gweiToWei(minFee);
    // The backend may return a decimal gas price, so it's clamped and rounded to integer wei.
    const feeInWei = new BigNumber(estimatedFee.feePerUnit).toNumber();
    const feePerUnit = new BigNumber(clamp(feeInWei, minFeeInWei, gweiToWei(maxFee))).toFixed(0);
    const { eip1559 } = estimatedFee;

    if (!eip1559?.baseFeePerGas) {
        return [{ ...defaultLevel, ...estimatedFee, feePerUnit }];
    }

    const minPriorityFeeInWei = gweiToWei(minPriorityFee);

    return (['low', 'medium', 'high'] as const)
        .map(levelKey => {
            const level = eip1559[levelKey];
            if (!level?.maxFeePerGas || !level?.maxPriorityFeePerGas) {
                return null;
            }

            const maxFeePerGas = BigNumber.max(
                minFeeInWei,
                level.maxFeePerGas,
                minPriorityFeeInWei,
            ).toFixed(0);
            const maxPriorityFeePerGas = BigNumber.max(
                minPriorityFeeInWei,
                BigNumber.min(maxFeePerGas, level.maxPriorityFeePerGas),
            ).toFixed(0);
            const blocksFromWaitTime = level.maxWaitTimeEstimate
                ? Math.ceil(level.maxWaitTimeEstimate / 1000 / blockTime)
                : 0;

            return {
                label: levelKey === 'medium' ? 'normal' : levelKey,
                feePerUnit,
                feeLimit: estimatedFee.feeLimit,
                blocks: blocksFromWaitTime || DEFAULT_EIP1559_BLOCKS[levelKey],
                baseFeePerGas: eip1559.baseFeePerGas,
                maxFeePerGas,
                maxPriorityFeePerGas,
            } satisfies FeeLevel;
        })
        .filter(isNotNull);
};

// The fee is clamped to the coin's limits, as XRP occasionally reports anything from 1 to a very
// high number.
const getMiscLevels = (
    { minFee, maxFee, defaultFees: [defaultLevel] }: BackendCoinInfo,
    [estimatedFee]: EstimatedFees,
): FeeLevel[] | undefined => {
    if (!estimatedFee || !defaultLevel) return;

    const fee = new BigNumber(estimatedFee.feePerUnit).toNumber();
    const feePerUnit = clamp(fee, minFee, maxFee).toString();

    return [{ ...defaultLevel, ...estimatedFee, feePerUnit }];
};

// Resolves to undefined when the backend gives no estimate.
const estimateLevels = async (
    backend: Blockchain,
    coinInfo: BackendCoinInfo,
    request: EstimateFeeRequest,
): Promise<FeeLevel[] | undefined> => {
    switch (coinInfo.type) {
        case 'bitcoin': {
            const levels = lastLevels[coinInfo.shortcut] ?? coinInfo.defaultFees;
            const blocks = levels.map(level => level.blocks);

            return getBitcoinLevels(coinInfo, levels, await backend.estimateFee({ blocks }));
        }
        case 'ethereum':
            return getEthereumLevels(coinInfo, await backend.estimateFee(request));
        case 'misc':
            return getMiscLevels(coinInfo, await backend.estimateFee(request));
        default:
            return exhaustive(coinInfo.type);
    }
};

export const estimateFee = async (params: EstimateFeeParams, postMessage: PostMessage) => {
    validateParams(params, [...COIN_PARAMS, { name: 'request', type: 'object' }]);
    const { request } = params;
    if (request) {
        validateParams(request, [
            { name: 'blocks', type: 'array' },
            { name: 'specific', type: 'object' },
            { name: 'feeLevels', type: 'string' },
        ]);
        if (request.specific) {
            validateParams(request.specific, [
                { name: 'conservative', type: 'boolean' },
                { name: 'data', type: 'string' },
                { name: 'from', type: 'string' },
                { name: 'to', type: 'string' },
                { name: 'txsize', type: 'number' },
                { name: 'newAccountProgramName', type: 'string' },
                { name: 'privatePending', type: 'object' },
            ]);
        }
    }

    const coinInfo = getBackendCoinInfo(params.coin);
    assertBackendSupported(coinInfo);
    const { blockTime, minFee, maxFee, minPriorityFee, shortcut, defaultFees } = coinInfo;
    const dustLimit = coinInfo.type === 'bitcoin' ? coinInfo.dustLimit : undefined;

    let levels;
    if (request?.feeLevels) {
        // In Suite, request.feeLevels: 'smart' is always used to update the fee levels.
        // Only on initial load, request.feeLevels: 'preloaded' is used (see feesThunks in suite-common/wallet-core)
        if (request.feeLevels === 'smart') {
            const backend = await initCoinBackend(params, postMessage);
            const estimatedLevels = await estimateLevels(backend, coinInfo, request).catch(
                () => undefined,
            );
            if (estimatedLevels) lastLevels[shortcut] = estimatedLevels;
        }

        levels = lastLevels[shortcut] ?? defaultFees;
    } else {
        const backend = await initCoinBackend(params, postMessage);
        levels = await backend.estimateFee(request || {});
    }

    return { blockTime, minFee, maxFee, minPriorityFee, dustLimit, levels };
};
