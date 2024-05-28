import { fromWei } from 'web3-utils';

import { Account, StakingPoolExtended } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils/src/bigNumber';

export const getEverstakePool = (account?: Account) => {
    if (account?.networkType !== 'ethereum') {
        return undefined;
    }

    return account?.misc?.stakingPools?.find(pool => pool.name === 'Everstake');
};

export const getAccountEverstakeStakingPool = (
    account?: Account,
): StakingPoolExtended | undefined => {
    const pool = getEverstakePool(account);

    if (!pool) return undefined;

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
