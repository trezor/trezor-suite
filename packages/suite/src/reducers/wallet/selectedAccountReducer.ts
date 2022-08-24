import { accountsActions } from '@suite-common/wallet-core';
import type { Action } from '@suite-types';
import type { SelectedAccountStatus } from '@suite-common/wallet-types';

export type State = SelectedAccountStatus;

export const initialState: State = {
    status: 'none',
};

const selectedAccountReducer = (state: State = initialState, action: Action): State => {
    if (accountsActions.updateSelectedAccount.match(action)) return action.payload;
    if (accountsActions.disposeAccount.match(action)) return initialState;
    return state;
};

export default selectedAccountReducer;
