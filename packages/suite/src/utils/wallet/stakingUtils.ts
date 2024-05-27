import { Account, StakingPoolExtended } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils/src/bigNumber';
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
