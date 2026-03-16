import { type PublicClient } from 'viem';

import { type Eip1559Fees } from '@trezor/blockchain-link-types/src/blockbook-api';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';

import { averageRewards, calculateBlockTime } from './block';
import { toHex } from './hex';
import { EIP1559_BLOCKS_TO_ANALYZE, EIP1559_PERCENTILES } from '../constants';

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
        const baseFeePerGas = feeHistory.baseFeePerGas[EIP1559_BLOCKS_TO_ANALYZE - 1] ?? 0n;

        const avgPriorityFeeLow = averageRewards(feeHistory.reward ?? [], 0);
        const avgPriorityFeeMedium = averageRewards(feeHistory.reward ?? [], 1);
        const avgPriorityFeeHigh = averageRewards(feeHistory.reward ?? [], 2);

        const fees: Eip1559Fees = {
            baseFeePerGas: baseFeePerGas.toString(),
            low: {
                maxFeePerGas: (baseFeePerGas + avgPriorityFeeLow).toString(),
                maxPriorityFeePerGas: (basePriorityFeeBigInt * 1n).toString(),
                ...(blockTime !== null && { maxWaitTimeEstimate: blockTime * 4 }),
            },
            medium: {
                maxFeePerGas: (baseFeePerGas + avgPriorityFeeMedium).toString(),
                maxPriorityFeePerGas: (basePriorityFeeBigInt * 2n).toString(),
                ...(blockTime !== null && { maxWaitTimeEstimate: blockTime * 3 }),
            },
            high: {
                maxFeePerGas: (baseFeePerGas + avgPriorityFeeHigh).toString(),
                maxPriorityFeePerGas: (basePriorityFeeBigInt * 4n).toString(),
                ...(blockTime !== null && { maxWaitTimeEstimate: blockTime * 2 }),
            },
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
