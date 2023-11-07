import { isAnyOf } from '@reduxjs/toolkit';
import { A, G, pipe } from '@mobily/ts-belt';
import { memoize, memoizeWithArgs } from 'proxy-memoize';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { enhanceHistory, isTestnet, isUtxoBased } from '@suite-common/wallet-utils';
import { Account, AccountKey } from '@suite-common/wallet-types';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';

import { selectCoins, FiatRatesRootState } from '../fiat-rates/fiatRatesReducer';
import { accountsActions } from './accountsActions';
import { formattedAccountTypeMap } from './constants';
import {
    DeviceRootState,
    selectDevice,
    selectIsDeviceDiscoveryActive,
} from '../device/deviceReducer';
import { DiscoveryRootState } from '../discovery/discoveryReducer';

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
            .addCase(accountsActions.createIndexLabeledAccount, (state, action) => {
                const { deviceState, symbol } = action.payload;
                const deviceNetworkAccounts = state.filter(
                    account => account.deviceState === deviceState && account.symbol === symbol,
                );

                const indexOfLastAccount = deviceNetworkAccounts.length;
                const networkName = networks[symbol].name;
                const accountLabel = `${networkName} #${indexOfLastAccount + 1}`;

                const account = {
                    ...action.payload,
                    accountLabel,
                    history: enhanceHistory(action.payload.history),
                };
                state.push(account);
            })
            .addCase(accountsActions.updateAccount, (state, action) => {
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
            .addMatcher(isAnyOf(extra.actions.setAccountAddMetadata), (state, action) => {
                const { payload } = action;
                setMetadata(state, payload);
            });
    },
);

export const selectAccounts = (state: AccountsRootState) => state.wallet.accounts;

export const selectDeviceAccounts = (state: AccountsRootState & DeviceRootState) =>
    pipe(
        selectAccounts(state),
        A.filter(account => account.deviceState === selectDevice(state)?.state),
    );

export const selectMainnetAccounts = memoize((state: AccountsRootState) =>
    pipe(
        selectAccounts(state),
        A.filter(account => !isTestnet(account.symbol)),
    ),
);

export const selectAccountByKey = (state: AccountsRootState, accountKey: AccountKey) => {
    const accounts = selectAccounts(state);

    return accounts.find(account => account.key === accountKey) ?? null;
};

export const selectHasAccountTransactions = (state: AccountsRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);

    return !!account?.history.total;
};

export const selectAccountsByNetworkSymbol = memoizeWithArgs(
    (state: AccountsRootState, networkSymbol: NetworkSymbol | null) => {
        if (G.isNull(networkSymbol)) return [];

        const accounts = selectAccounts(state);

        return A.filter(accounts, account => account.symbol === networkSymbol);
    },
    {
        size: Object.keys(networks).length,
    },
);

export const selectAccountsByNetworkAndDevice = memoizeWithArgs(
    (state: AccountsRootState, deviceState: string, networkSymbol: NetworkSymbol) => {
        const accounts = selectAccounts(state);

        return accounts.filter(
            account => account.deviceState === deviceState && account.symbol === networkSymbol,
        );
    },
    {
        size: 80,
    },
);

export const selectAccountLabel = (
    state: AccountsRootState,
    accountKey: AccountKey,
): string | null => {
    const account = selectAccountByKey(state, accountKey);

    if (!account) return null;

    return account.accountLabel ?? null;
};

export const selectAccountNetworkSymbol = (
    state: AccountsRootState,
    accountKey: AccountKey,
): NetworkSymbol | null => {
    const account = selectAccountByKey(state, accountKey);

    if (!account) return null;

    return account.symbol;
};

export const selectFormattedAccountType = (
    state: AccountsRootState,
    accountKey: AccountKey,
): string | null => {
    const account = selectAccountByKey(state, accountKey);
    if (!account) return null;

    return formattedAccountTypeMap[account.accountType] ?? null;
};

export const selectIsAccountUtxoBased = (state: AccountsRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);

    return account ? isUtxoBased(account) : false;
};

export const selectIsTestnetAccount = (state: AccountsRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);

    return account ? isTestnet(account.symbol) : false;
};

export const selectAccountByDescriptorAndNetworkSymbol = (
    state: AccountsRootState,
    accountDescriptor: string,
    networkSymbol: NetworkSymbol,
) => {
    const accounts = selectAccounts(state);

    return (
        A.find(
            accounts,
            account => account.descriptor === accountDescriptor && account.symbol === networkSymbol,
        ) ?? null
    );
};

export const selectAccountKeyByDescriptorAndNetworkSymbol = (
    state: AccountsRootState,
    accountDescriptor?: string,
    networkSymbol?: NetworkSymbol,
): AccountKey | null => {
    if (!accountDescriptor || !networkSymbol) return null;
    const account = selectAccountByDescriptorAndNetworkSymbol(
        state,
        accountDescriptor,
        networkSymbol,
    );

    return account?.key ?? null;
};

export const selectAccountsAmountPerSymbol = (
    state: AccountsRootState & DeviceRootState,
    networkSymbol: NetworkSymbol,
) => {
    const accounts = selectDeviceAccounts(state);

    return pipe(
        accounts,
        A.filter(account => account.symbol === networkSymbol),
        A.length,
    );
};

export const selectAccountsSymbols = memoize(
    (state: AccountsRootState): NetworkSymbol[] =>
        pipe(
            selectAccounts(state),
            A.map(a => a.symbol),
            A.uniq,
        ) as NetworkSymbol[],
);

export const selectIsAccountWithRatesByKey = (
    state: AccountsRootState & FiatRatesRootState,
    accountKey: string,
) => {
    const account = selectAccountByKey(state, accountKey);

    if (!account) {
        return false;
    }

    const rates = selectCoins(state);

    return !!rates.find(rate => rate.symbol === account.symbol);
};

export const selectIsAccountsListEmpty = (state: AccountsRootState & DeviceRootState) =>
    pipe(selectDeviceAccounts(state), A.isEmpty);

export const selectIsPortfolioEmpty = (
    state: AccountsRootState & DeviceRootState & DiscoveryRootState,
) => {
    const isAccountsListEmpty = selectIsAccountsListEmpty(state);
    const isDiscoveryActive = selectIsDeviceDiscoveryActive(state);

    return isAccountsListEmpty && !isDiscoveryActive;
};
