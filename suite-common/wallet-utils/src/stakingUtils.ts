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
        autocompoundBalance: fromWei(pool.autocompoundBalance, 'ether'),
        claimableAmount: fromWei(pool.claimableAmount, 'ether'),
        depositedBalance: fromWei(pool.depositedBalance, 'ether'),
        pendingBalance: fromWei(pool.pendingBalance, 'ether'),
        pendingDepositedBalance: fromWei(pool.pendingDepositedBalance, 'ether'),
        restakedReward: fromWei(pool.restakedReward, 'ether'),
        withdrawTotalAmount: fromWei(pool.withdrawTotalAmount, 'ether'),
        totalPendingStakeBalance: fromWei(
            new BigNumber(pool.pendingBalance).plus(pool.pendingDepositedBalance).toString(),
            'ether',
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

export const getAccountTotalStakingBalance = (account?: Account) => {
    const pool = getAccountEverstakeStakingPool(account);

    return new BigNumber(pool?.autocompoundBalance ?? '0')
        .plus(pool?.pendingBalance ?? '0')
        .plus(pool?.pendingDepositedBalance ?? '0')
        .plus(pool?.withdrawTotalAmount ?? '0')
        .toFixed();
};
