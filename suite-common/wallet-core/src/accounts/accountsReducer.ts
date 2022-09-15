import { createSelector, isAnyOf } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { Account } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { accountsActions } from './accountsActions';

export type AccountsState = Account[];

export const accountsInitialState: AccountsState = [];

export type AccountsRootState = {
    wallet: {
        accounts: AccountsState;
    };
};

const accountEqualTo = (b: Account) => (a: Account) =>
    a.deviceState === b.deviceState && a.descriptor === b.descriptor && a.symbol === b.symbol;

const update = (state: AccountsState, account: Account) => {
    const accountIndex = state.findIndex(accountEqualTo(account));

    if (accountIndex !== -1) {
        state[accountIndex] = account;

        if (!account.marker) {
            // immer.js doesn't update fields that are set to undefined, so instead we delete the field
            delete state[accountIndex].marker;
        }
    } else {
        console.warn(
            `Tried to update account that does not exist: ${account.descriptor} (symbol: ${account.symbol})`,
        );
    }
};

const remove = (state: AccountsState, accounts: Account[]) => {
    accounts.forEach(a => {
        const index = state.findIndex(accountEqualTo(a));
        state.splice(index, 1);
    });
};

const setMetadata = (state: AccountsState, account: Account) => {
    const index = state.findIndex(a => a.key === account.key);
    if (!state[index]) return;
    state[index].metadata = account.metadata;
};

export const prepareAccountsReducer = createReducerWithExtraDeps(
    accountsInitialState,
    (builder, extra) => {
        builder
            .addCase(accountsActions.removeAccount, (state, action) => {
                remove(state, action.payload);
            })
            .addCase(accountsActions.createAccount, (state, action) => {
                // TODO: check if account already exist, for example 2 device instances with same passphrase
                // remove "transactions" field, they are stored in "transactionReducer"
                const account = action.payload;
                if (account.history) {
                    delete account.history.transactions;
                }
                state.push(account);
            })
            .addCase(accountsActions.updateAccount, (state, action) => {
                update(state, action.payload);
            })
            .addCase(accountsActions.changeAccountVisibility, (state, action) => {
                update(state, action.payload);
            })
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadAccounts)
            .addMatcher(
                isAnyOf(
                    extra.actions.setAccountLoadedMetadata,
                    extra.actions.setAccountAddMetadata,
                ),
                (state, action) => {
                    const { payload } = action;
                    setMetadata(state, payload);
                },
            );
    },
);

export const selectAccounts = (state: AccountsRootState) => state.wallet.accounts;

export const selectAccount = createSelector(
    selectAccounts,
    (_state, accountKey: string) => accountKey,
    (accounts, accountKey) => accounts.find(account => account.key === accountKey),
);

export const selectDeviceNetworkAccounts = createSelector(
    selectAccounts,
    (_state, deviceState: string, networkSymbol: NetworkSymbol) => ({
        deviceState,
        networkSymbol,
    }),
    (accounts, params) =>
        accounts.filter(
            account =>
                account.deviceState === params.deviceState &&
                account.symbol === params.networkSymbol,
        ),
);

export const selectAccountName = createSelector(
    [selectAccount, selectAccounts],
    (account, accounts) => {
        const accountData = accounts.find(acc => acc.descriptor === account?.descriptor);
        if (accountData) {
            const {
                metadata: { accountLabel },
            } = accountData;
            return accountLabel;
        }
        return '';
    },
);
