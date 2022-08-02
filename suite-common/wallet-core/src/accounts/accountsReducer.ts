import { createSelector, isAnyOf } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { enhanceHistory, isUtxoBased } from '@suite-common/wallet-utils';
import { Account } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { accountsActions } from './accountsActions';

export const accountsInitialState: Account[] = [];

export type AccountsRootState = {
    wallet: {
        accounts: Account[];
    };
};

const findCoinjoinAccount =
    (key: string) =>
    (account: Account): account is Extract<Account, { backendType: 'coinjoin' }> =>
        account.key === key && account.backendType === 'coinjoin';

const accountEqualTo = (b: Account) => (a: Account) =>
    a.deviceState === b.deviceState && a.descriptor === b.descriptor && a.symbol === b.symbol;

const update = (state: Account[], account: Account) => {
    const accountIndex = state.findIndex(accountEqualTo(account));

    if (accountIndex !== -1) {
        state[accountIndex] = {
            ...account,
            // remove "transactions" field, they are stored in "transactionReducer"
            history: enhanceHistory(account.history),
        };

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

const remove = (state: Account[], accounts: Account[]) => {
    accounts.forEach(a => {
        const index = state.findIndex(accountEqualTo(a));
        state.splice(index, 1);
    });
};

const setMetadata = (state: Account[], account: Account) => {
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
                const account = {
                    ...action.payload,
                    // remove "transactions" field, they are stored in "transactionReducer"
                    history: enhanceHistory(action.payload.history),
                };
                state.push(account);
            })
            .addCase(accountsActions.updateAccount, (state, action) => {
                update(state, action.payload);
            })
            .addCase(accountsActions.changeAccountVisibility, (state, action) => {
                update(state, action.payload);
            })
            .addCase(accountsActions.startCoinjoinAccountSync, (state, action) => {
                const account = state.find(findCoinjoinAccount(action.payload.accountKey));
                if (account) {
                    account.syncing = true;
                }
            })
            .addCase(accountsActions.endCoinjoinAccountSync, (state, action) => {
                const account = state.find(findCoinjoinAccount(action.payload.accountKey));
                if (account) {
                    account.syncing = undefined;
                    account.status = action.payload.status;
                }
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

export const selectAccountByKey = createSelector(
    selectAccounts,
    (_state: AccountsRootState, accountKey: string) => accountKey,
    (accounts, accountKey) => accounts.find(account => account.key === accountKey),
);

export const selectAccountsByNetworkSymbols = createSelector(
    [
        selectAccounts,
        (_state: AccountsRootState, networkSymbols: NetworkSymbol[]) => networkSymbols,
    ],
    (accounts, networkSymbols) =>
        accounts.filter(account => networkSymbols.includes(account.symbol)),
);

export const selectAccountsByNetworkAndDevice = createSelector(
    selectAccounts,
    (_state: AccountsRootState, deviceState: string, networkSymbol: NetworkSymbol) => ({
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

export const selectAccountLabel = createSelector(
    [selectAccountByKey, selectAccounts],
    (account, accounts) => {
        const accountData = accounts.find(acc => acc.descriptor === account?.descriptor);
        if (accountData) {
            const {
                metadata: { accountLabel },
            } = accountData;
            return accountLabel;
        }
    },
);

export const selectIsAccountUtxoBased = createSelector([selectAccountByKey], account =>
    account ? isUtxoBased(account) : false,
);
