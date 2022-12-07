import { accountsActions } from '@suite-common/wallet-core';
import type { Action } from '@suite-types';
import type { SelectedAccountStatus } from '@suite-common/wallet-types';

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

export const selectSelectedAccountParams = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.params;

export default selectedAccountReducer;
