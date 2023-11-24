import { accountsActions } from '@suite-common/wallet-core';
import type { Action } from 'src/types/suite';
import type { SelectedAccountStatus } from '@suite-common/wallet-types';
import { MIN_ETH_AMOUNT_FOR_STAKING } from 'src/constants/suite/ethStaking';

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
    const { formattedBalance, symbol } = state.wallet.selectedAccount.account ?? {};

    if (typeof formattedBalance !== 'string' || symbol !== 'eth') return false;

    return MIN_ETH_AMOUNT_FOR_STAKING.isLessThanOrEqualTo(formattedBalance);
};

export default selectedAccountReducer;
