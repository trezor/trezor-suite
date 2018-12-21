/* @flow */

import * as ACCOUNT from 'actions/constants/account';
import type { Action } from 'flowtype';
import type { Account, State } from 'reducers/AccountsReducer';

export type AccountAction = {
    type: typeof ACCOUNT.FROM_STORAGE,
    payload: State
} | {
    type: typeof ACCOUNT.CREATE | typeof ACCOUNT.UPDATE,
    payload: Account,
};

export const update = (account: Account): Action => ({
    type: ACCOUNT.UPDATE,
    payload: account,
});
