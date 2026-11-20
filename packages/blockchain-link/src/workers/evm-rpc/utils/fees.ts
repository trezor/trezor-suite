import { type PublicClient } from 'viem';

import {
    type Eip1559Fee,
    type Eip1559Fees,
    type MessageTypes,
} from '@trezor/blockchain-link-types';

import { averageRewards, calculateBlockTime } from './block';
import { toHex } from './hex';
import { EIP1559_BLOCKS_TO_ANALYZE, EIP1559_PERCENTILES } from '../constants';

const bigIntMax = (a: bigint, b: bigint): bigint => (a > b ? a : b);

/**
 * Builds one { maxFeePerGas, maxPriorityFeePerGas } tier.
 *
 * `maxPriorityFeePerGas` (the tip) is the node-suggested `eth_maxPriorityFeePerGas`,
 * scaled per tier. `maxFeePerGas` (the cap) starts from `baseFeePerGas` plus the
 * tier's observed average reward from `eth_feeHistory` - but that average and the
 * node's tip suggestion come from unrelated sources that can diverge (observed
 * on Optimism/BSC, where the tip can be an order of magnitude above the average
 * reward). The cap is raised to the tip when needed so `maxFeePerGas >=
 * maxPriorityFeePerGas` holds unconditionally - the EIP-1559 invariant a node
 * enforces before accepting a transaction.
 */
const buildFeeTier = (
    baseFeePerGas: bigint,
    avgPriorityFee: bigint,
    tip: bigint,
    maxWaitTimeEstimate?: number,
): Eip1559Fee => ({
    maxFeePerGas: bigIntMax(baseFeePerGas + avgPriorityFee, tip).toString(),
    maxPriorityFeePerGas: tip.toString(),
    ...(maxWaitTimeEstimate !== undefined && { maxWaitTimeEstimate }),
});

export const calculateEip1559Fees = async (
    client: PublicClient,
): Promise<Eip1559Fees | undefined> => {
    try {
        const [basePriorityFee, feeHistory, blockTime] = await Promise.all([
            client.request({ method: 'eth_maxPriorityFeePerGas' }),
            client.getFeeHistory({
                blockCount: EIP1559_BLOCKS_TO_ANALYZE,
                blockTag: 'pending',
                rewardPercentiles: EIP1559_PERCENTILES,
            }),
            calculateBlockTime(client),
        ]);

        const basePriorityFeeBigInt = BigInt(basePriorityFee);

        // `feeHistory.baseFeePerGas` has `blockCount + 1` entries when the full
        // history is returned - the last one is the network's own projection of
        // the NEXT block's base fee, not an already-observed value. A node may
        // return fewer entries than requested (observed on Avalanche); as long as
        // at least one entry comes back, its last element is still that node's
        // real projection and is safe to use. Only a genuinely empty array (no
        // usable value at all) fails closed instead of emitting a fabricated "0".
        const baseFeePerGas = feeHistory.baseFeePerGas.at(-1);
        if (baseFeePerGas === undefined) {
            throw new Error('[evm-rpc] eth_feeHistory returned no baseFeePerGas entries');
        }

        const avgPriorityFeeLow = averageRewards(feeHistory.reward ?? [], 0);
        const avgPriorityFeeMedium = averageRewards(feeHistory.reward ?? [], 1);
        const avgPriorityFeeHigh = averageRewards(feeHistory.reward ?? [], 2);
        const avgPriorityFeeInstant = averageRewards(feeHistory.reward ?? [], 3);

        const fees: Eip1559Fees = {
            baseFeePerGas: baseFeePerGas.toString(),
            low: buildFeeTier(
                baseFeePerGas,
                avgPriorityFeeLow,
                basePriorityFeeBigInt * 1n,
                blockTime !== null ? blockTime * 4 : undefined,
            ),
            medium: buildFeeTier(
                baseFeePerGas,
                avgPriorityFeeMedium,
                basePriorityFeeBigInt * 2n,
                blockTime !== null ? blockTime * 3 : undefined,
            ),
            high: buildFeeTier(
                baseFeePerGas,
                avgPriorityFeeHigh,
                basePriorityFeeBigInt * 4n,
                blockTime !== null ? blockTime * 2 : undefined,
            ),
            instant: buildFeeTier(
                baseFeePerGas,
                avgPriorityFeeInstant,
                basePriorityFeeBigInt * 8n,
                blockTime !== null ? blockTime * 1 : undefined,
            ),
        };

        return fees;
    } catch (error) {
        console.warn('[evm-rpc] Failed to calculate EIP-1559 fees:', error);

        return undefined;
    }
};

export const estimateGasLimit = async (
    client: PublicClient,
    specific: MessageTypes.EstimateFee['payload']['specific'],
): Promise<bigint | undefined> => {
    if (!specific?.to) {
        return undefined;
    }

    try {
        const params = {
            account: specific.from ? toHex(specific.from) : undefined,
            to: toHex(specific.to),
            data: specific.data ? toHex(specific.data) : undefined,
            value: specific.value ? BigInt(specific.value) : undefined,
        };

        const gasEstimate = await client.estimateGas(params);

        return gasEstimate;
    } catch {
        return undefined;
    }
};
