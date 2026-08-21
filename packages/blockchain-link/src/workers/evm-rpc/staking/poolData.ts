import type { PublicClient } from 'viem';

import type { StakingPool } from '@trezor/blockchain-link-types';

import { EVERSTAKE_ACCOUNTING_ABI } from './abi';
import { STAKING_POOL_CONTRACTS } from './constants';
import { type BatchCall, batchRead, getChainId } from '../utils/multicall';

const ACCOUNTING_FUNCTIONS = [
    'pendingBalanceOf',
    'pendingDepositedBalanceOf',
    'depositedBalanceOf',
    'withdrawRequest',
    'restakedRewardOf',
    'autocompoundBalanceOf',
] as const;

const readAccountingBalances = async (
    client: PublicClient,
    contract: `0x${string}`,
    address: `0x${string}`,
) => {
    const calls: BatchCall[] = ACCOUNTING_FUNCTIONS.map(functionName => ({
        address: contract,
        abi: EVERSTAKE_ACCOUNTING_ABI,
        functionName,
        args: [address],
    }));

    const results = await batchRead(client, calls);

    const unread = ACCOUNTING_FUNCTIONS.filter((_, index) => results[index] === undefined);
    if (unread.length > 0) {
        throw new Error(`Could not read staking accounting: ${unread.join(', ')}`);
    }

    // Order follows ACCOUNTING_FUNCTIONS; withdrawRequest is the only tuple return.
    const [
        pendingBalance,
        pendingDepositedBalance,
        depositedBalance,
        withdrawRequestResult,
        restakedReward,
        autocompoundBalance,
    ] = results as [bigint, bigint, bigint, readonly [bigint, bigint], bigint, bigint];

    const [withdrawTotalAmount, claimableAmount] = withdrawRequestResult;

    return {
        pendingBalance,
        pendingDepositedBalance,
        depositedBalance,
        withdrawTotalAmount,
        claimableAmount,
        restakedReward,
        autocompoundBalance,
    };
};

export const getStakingPoolData = async (
    client: PublicClient,
    address: `0x${string}`,
): Promise<StakingPool[] | undefined> => {
    try {
        const chainId = await getChainId(client);
        const poolConfig = STAKING_POOL_CONTRACTS[chainId];

        if (!poolConfig) {
            return undefined;
        }

        const { contract, name } = poolConfig;
        const balances = await readAccountingBalances(client, contract, address);

        if (Object.values(balances).every(value => value === 0n)) {
            return undefined;
        }

        return [
            {
                contract,
                name,
                pendingBalance: balances.pendingBalance.toString(),
                pendingDepositedBalance: balances.pendingDepositedBalance.toString(),
                depositedBalance: balances.depositedBalance.toString(),
                withdrawTotalAmount: balances.withdrawTotalAmount.toString(),
                claimableAmount: balances.claimableAmount.toString(),
                restakedReward: balances.restakedReward.toString(),
                autocompoundBalance: balances.autocompoundBalance.toString(),
            },
        ];
    } catch (error) {
        console.warn('[evm-rpc] Failed to fetch staking pool data:', error);

        return undefined;
    }
};
