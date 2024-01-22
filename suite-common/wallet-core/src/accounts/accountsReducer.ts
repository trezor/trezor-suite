import { isAnyOf } from '@reduxjs/toolkit';
import { A, D, G, pipe } from '@mobily/ts-belt';
import { memoize, memoizeWithArgs } from 'proxy-memoize';

import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { enhanceHistory, isTestnet, isUtxoBased } from '@suite-common/wallet-utils';
import { Account, AccountKey } from '@suite-common/wallet-types';
import { AccountType, networks, NetworkSymbol } from '@suite-common/wallet-config';

import { accountsActions } from './accountsActions';
import { formattedAccountTypeMap } from './constants';
import {
    DeviceRootState,
    selectDevice,
    selectIsNoPhysicalDeviceConnected,
    selectIsPortfolioTrackerDevice,
    selectPersistedDeviceStates,
} from '../device/deviceReducer';
import { DiscoveryRootState, selectIsDeviceDiscoveryActive } from '../discovery/discoveryReducer';

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
                const { deviceState, symbol, accountType } = action.payload;
                const matchingNetworkAndTypeAccounts = state.filter(
                    account =>
                        account.deviceState === deviceState &&
                        account.symbol === symbol &&
                        account.accountType === accountType,
                );

                const indexOfPreviousAccount = matchingNetworkAndTypeAccounts.length;
                const networkName = networks[symbol].name;
                const accountLabel = `${networkName} #${indexOfPreviousAccount + 1}`;

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

export const selectAccountsByDeviceState = memoizeWithArgs(
    (state: AccountsRootState, deviceState: string): Account[] =>
        pipe(
            selectAccounts(state),
            A.filter(account => account.deviceState === deviceState),
        ) as Account[],
    // cache up to 3 devices to make sure it works correctly
    { size: 3 },
);

export const selectDeviceAccounts = (state: AccountsRootState & DeviceRootState) => {
    const device = selectDevice(state);

    if (!device?.state) return [];

    return selectAccountsByDeviceState(state, device.state);
};

export const selectDeviceAccountsForNetworkSymbolAndAccountType = memoizeWithArgs(
    (
        state: AccountsRootState & DeviceRootState,
        networkSymbol: NetworkSymbol,
        accountType: AccountType,
    ) => {
        const accounts = selectDeviceAccounts(state);

        return accounts.filter(
            account => account.symbol === networkSymbol && account.accountType === accountType,
        );
    },
    // memoize data for every network
    { size: D.keys(networks).length },
);

export const selectDeviceAccountsLengthPerNetwork = (state: AccountsRootState & DeviceRootState) =>
    pipe(
        selectDeviceAccounts(state),
        A.groupBy(account => account.symbol),
        Object.entries,
        A.map(([symbol, accounts]) => [symbol, accounts.length]),
        pairs => Object.fromEntries(pairs),
    );

export const selectDeviceMainnetAccounts = memoize((state: AccountsRootState & DeviceRootState) =>
    pipe(
        selectDeviceAccounts(state),
        A.filter(account => !isTestnet(account.symbol)),
    ),
);

export const selectNumberOfAccounts = (state: AccountsRootState) => selectAccounts(state).length;

export const selectUserHasAccounts = (state: AccountsRootState): boolean =>
    pipe(selectAccounts(state), A.isNotEmpty);

export const selectAccountByKey = (state: AccountsRootState, accountKey?: AccountKey) => {
    if (!accountKey) return null;

    const accounts = selectAccounts(state);

    return accounts.find(account => account.key === accountKey) ?? null;
};

export const selectHasAccountTransactions = (state: AccountsRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);

    return !!account?.history.total;
};

export const selectDeviceAccountsByNetworkSymbol = memoizeWithArgs(
    (state: AccountsRootState & DeviceRootState, networkSymbol: NetworkSymbol | null) => {
        if (G.isNull(networkSymbol)) return [];

        const accounts = selectDeviceAccounts(state);

        return A.filter(accounts, account => account.symbol === networkSymbol);
    },
    {
        size: Object.keys(networks).length,
    },
);

export const selectVisibleNonEmptyDeviceAccountsByNetworkSymbol = (
    state: AccountsRootState & DeviceRootState,
    networkSymbol: NetworkSymbol | null,
) =>
    selectDeviceAccountsByNetworkSymbol(state, networkSymbol).filter(
        account => !account.empty || account.visible,
    );

export const selectAccountsByNetworkAndDeviceState = memoizeWithArgs(
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
    accountKey?: AccountKey,
): string | null => {
    const account = selectAccountByKey(state, accountKey);

    if (!account) return null;

    return account.accountLabel ?? null;
};

export const selectAccountNetworkSymbol = (
    state: AccountsRootState,
    accountKey?: AccountKey,
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

    const { networkType, accountType } = account;
    const formattedType = formattedAccountTypeMap[networkType]?.[accountType];

    if (!formattedType) return null;

    return formattedType;
};

export const selectIsAccountUtxoBased = (state: AccountsRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);

    return account ? isUtxoBased(account) : false;
};

export const selectIsTestnetAccount = (state: AccountsRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);

    return account ? isTestnet(account.symbol) : false;
};

export const selectDeviceAccountByDescriptorAndNetworkSymbol = (
    state: AccountsRootState & DeviceRootState,
    accountDescriptor: string,
    networkSymbol: NetworkSymbol,
) => {
    const accounts = selectDeviceAccounts(state);

    return (
        A.find(
            accounts,
            account => account.descriptor === accountDescriptor && account.symbol === networkSymbol,
        ) ?? null
    );
};

export const selectDeviceAccountKeyByDescriptorAndNetworkSymbol = (
    state: AccountsRootState & DeviceRootState,
    accountDescriptor?: string,
    networkSymbol?: NetworkSymbol,
): AccountKey | null => {
    if (!accountDescriptor || !networkSymbol) return null;
    const account = selectDeviceAccountByDescriptorAndNetworkSymbol(
        state,
        accountDescriptor,
        networkSymbol,
    );

    return account?.key ?? null;
};

export const selectAccountsSymbols = memoize(
    (state: AccountsRootState): NetworkSymbol[] =>
        pipe(
            selectAccounts(state),
            A.map(a => a.symbol),
            A.uniq,
        ) as NetworkSymbol[],
);

export const selectIsDeviceAccountless = (state: AccountsRootState & DeviceRootState) =>
    pipe(selectDeviceAccounts(state), A.isEmpty);

export const selectIsDeviceDiscoveryEmpty = (
    state: AccountsRootState & DeviceRootState & DiscoveryRootState,
) => {
    const isDeviceAccountless = selectIsDeviceAccountless(state);
    const isDeviceDiscoveryActive = selectIsDeviceDiscoveryActive(state);

    return isDeviceAccountless && !isDeviceDiscoveryActive;
};

export const selectDevicelessAccounts = (state: AccountsRootState & DeviceRootState) => {
    const persistedDevicesStates = selectPersistedDeviceStates(state);

    return pipe(
        selectAccounts(state),
        A.filter(account => !persistedDevicesStates.includes(account.deviceState)),
    ) as Account[];
};

export const selectAreAllDevicesDisconnectedOrAccountless = (
    state: AccountsRootState & DeviceRootState & DiscoveryRootState,
) => {
    const isDeviceDiscoveryEmpty = selectIsDeviceDiscoveryEmpty(state);
    const isNoPhysicalDeviceConnected = selectIsNoPhysicalDeviceConnected(state);

    return isDeviceDiscoveryEmpty && isNoPhysicalDeviceConnected;
};

export const selectIsPortfolioTrackerEmpty = (
    state: AccountsRootState & DeviceRootState & DiscoveryRootState,
) => {
    const isPortfolioTrackerDevice = selectIsPortfolioTrackerDevice(state);
    const isDeviceDiscoveryEmpty = selectIsDeviceDiscoveryEmpty(state);

    return isPortfolioTrackerDevice && isDeviceDiscoveryEmpty;
};
