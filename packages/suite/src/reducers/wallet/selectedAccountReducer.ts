import { accountsActions } from '@suite-common/wallet-core';
import type { Action } from 'src/types/suite';
import type { SelectedAccountStatus, StakingPoolExtended } from '@suite-common/wallet-types';
import { MIN_ETH_BALANCE_FOR_STAKING } from 'src/constants/suite/ethStaking';
import { fromWei } from 'web3-utils';
import BigNumber from 'bignumber.js';

export type State = SelectedAccountStatus;

export type SelectedAccountRootState = {
    wallet: {
        selectedAccount: SelectedAccountStatus;
    };
};

export const initialState: State = {
    status: 'none',
};

const selectedAccountReducer = (state: State = initialState, action: Action): State => {
    if (accountsActions.updateSelectedAccount.match(action)) return action.payload;
    if (accountsActions.disposeAccount.match(action)) return initialState;

    return state;
};

export const selectSelectedAccount = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.account;

export const selectSelectedAccountBalance = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.account?.formattedBalance;

export const selectSelectedAccountParams = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.params;

export const selectSelectedAccountHasSufficientEthForStaking = (
    state: SelectedAccountRootState,
) => {
    const { formattedBalance, symbol } = selectSelectedAccount(state) ?? {};

    if (typeof formattedBalance !== 'string' || symbol !== 'eth') return false;

    return MIN_ETH_BALANCE_FOR_STAKING.isLessThanOrEqualTo(formattedBalance);
};

export const selectSelectedAccountEverstakeStakingPool = (
    state: SelectedAccountRootState,
): StakingPoolExtended | undefined => {
    const selectedAccount = selectSelectedAccount(state);
    const pool = selectedAccount?.stakingPools?.find(pool => pool.name === 'Everstake');

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

export const selectSelectedAccountAutocompoundBalance = (state: SelectedAccountRootState) => {
    const pool = selectSelectedAccountEverstakeStakingPool(state);
    return pool?.autocompoundBalance ?? '0';
};

export default selectedAccountReducer;
