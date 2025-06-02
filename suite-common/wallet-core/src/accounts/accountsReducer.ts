import { isAnyOf } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { networks } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { enhanceHistory, isAccountInCollection } from '@suite-common/wallet-utils';

import { accountsActions } from './accountsActions';
import { deviceActions } from '../device/deviceActions';

export type AccountsState = Account[];

export const accountsInitialState: AccountsState = [];

export type AccountsRootState = {
    wallet: {
        accounts: AccountsState;
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
                const { deviceState, symbol, accountType } = action.payload;
                const matchingNetworkAndTypeAccounts = state.filter(
                    account =>
                        account.deviceState === deviceState &&
                        account.symbol === symbol &&
                        account.accountType === accountType,
                );

                const indexOfPreviousAccount = matchingNetworkAndTypeAccounts.length;
                const networkName = networks[symbol].name;
                const accountLabel =
                    action.payload.accountLabel ?? `${networkName} #${indexOfPreviousAccount + 1}`;

                const account = {
                    ...action.payload,
                    accountLabel,
                    // remove "transactions" field, they are stored in "transactionReducer"
                    history: enhanceHistory(action.payload.history),
                };
                if (isAccountInCollection(account, state)) {
                    console.warn('Prevented duplicate account in accountsReducer: ', account);

                    return;
                }
                state.push(account);
            })
            .addCase(accountsActions.updateAccount, (state, action) => {
                update(state, action.payload);
            })
            .addCase(accountsActions.updateAccountRefreshTimestamp, (state, action) => {
                update(state, action.payload);
            })
            .addCase(accountsActions.renameAccount, (state, action) => {
                const { accountKey, accountLabel } = action.payload;
                const accountByAccountKey = state.find(account => account.key === accountKey);
                if (accountByAccountKey) accountByAccountKey.accountLabel = accountLabel;
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
            // Persistence of accounts and transactions in suite-native depends on device.remember state,
            // but redux-persist is not checking for changes in other reducers.
            // This is a workaround to update redux-persist state.
            .addCase(deviceActions.rememberDevice, state => [...state])
            .addMatcher(isAnyOf(extra.actions.setAccountAddMetadata), (state, action) => {
                const { payload } = action;
                setMetadata(state, payload);
            });
    },
);
