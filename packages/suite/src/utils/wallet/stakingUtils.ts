import { Account, StakingPoolExtended } from '@suite-common/wallet-types';
import BigNumber from 'bignumber.js';
import { fromWei } from 'web3-utils';

export const getAccountEverstakeStakingPool = (
    account?: Account,
): StakingPoolExtended | undefined => {
    if (account?.networkType !== 'ethereum') {
        return;
    }

    const pool = account?.misc?.stakingPools?.find(pool => pool.name === 'Everstake');

    if (!pool) return;

    return {
        ...pool,
        autocompoundBalance: fromWei(pool.autocompoundBalance),
        claimableAmount: fromWei(pool.claimableAmount),
        depositedBalance: fromWei(pool.depositedBalance),
        pendingBalance: fromWei(pool.pendingBalance),
        pendingDepositedBalance: fromWei(pool.pendingDepositedBalance),
        restakedReward: fromWei(pool.restakedReward),
        withdrawTotalAmount: fromWei(pool.withdrawTotalAmount),
        totalPendingStakeBalance: fromWei(
            new BigNumber(pool.pendingBalance).plus(pool.pendingDepositedBalance).toString(),
        ),
        canClaim:
            new BigNumber(pool.claimableAmount).gt(0) &&
            new BigNumber(pool.withdrawTotalAmount).eq(pool.claimableAmount),
    };
};

export const getAccountAutocompoundBalance = (account?: Account) => {
    const pool = getAccountEverstakeStakingPool(account);

    return pool?.autocompoundBalance ?? '0';
};
