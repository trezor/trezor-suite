import type { PublicClient } from 'viem';

import type { StakingPool } from '@trezor/blockchain-link-blockbook';

import { EVERSTAKE_ACCOUNTING_ABI } from './abi';
import { STAKING_POOL_CONTRACTS } from './constants';

export const getStakingPoolData = async (
    client: PublicClient,
    address: `0x${string}`,
): Promise<StakingPool[] | undefined> => {
    try {
        const chainId = await client.getChainId();
        const poolConfig = STAKING_POOL_CONTRACTS[chainId];

        if (!poolConfig) {
            return undefined;
        }

        const { contract, name } = poolConfig;
        const [
            pendingBalance,
            pendingDepositedBalance,
            depositedBalance,
            withdrawRequestResult,
            restakedReward,
            autocompoundBalance,
        ] = await Promise.all([
            client.readContract({
                address: contract,
                abi: EVERSTAKE_ACCOUNTING_ABI,
                functionName: 'pendingBalanceOf',
                args: [address],
            }),
            client.readContract({
                address: contract,
                abi: EVERSTAKE_ACCOUNTING_ABI,
                functionName: 'pendingDepositedBalanceOf',
                args: [address],
            }),
            client.readContract({
                address: contract,
                abi: EVERSTAKE_ACCOUNTING_ABI,
                functionName: 'depositedBalanceOf',
                args: [address],
            }),
            client.readContract({
                address: contract,
                abi: EVERSTAKE_ACCOUNTING_ABI,
                functionName: 'withdrawRequest',
                args: [address],
            }),
            client.readContract({
                address: contract,
                abi: EVERSTAKE_ACCOUNTING_ABI,
                functionName: 'restakedRewardOf',
                args: [address],
            }),
            client.readContract({
                address: contract,
                abi: EVERSTAKE_ACCOUNTING_ABI,
                functionName: 'autocompoundBalanceOf',
                args: [address],
            }),
        ]);

        const [withdrawTotalAmount, claimableAmount] = withdrawRequestResult;

        const allZero =
            pendingBalance === 0n &&
            pendingDepositedBalance === 0n &&
            depositedBalance === 0n &&
            withdrawTotalAmount === 0n &&
            claimableAmount === 0n &&
            restakedReward === 0n &&
            autocompoundBalance === 0n;

        if (allZero) {
            return undefined;
        }

        return [
            {
                contract,
                name,
                pendingBalance: pendingBalance.toString(),
                pendingDepositedBalance: pendingDepositedBalance.toString(),
                depositedBalance: depositedBalance.toString(),
                withdrawTotalAmount: withdrawTotalAmount.toString(),
                claimableAmount: claimableAmount.toString(),
                restakedReward: restakedReward.toString(),
                autocompoundBalance: autocompoundBalance.toString(),
            },
        ];
    } catch (error) {
        console.warn('[evm-rpc] Failed to fetch staking pool data:', error);

        return undefined;
    }
};
