import { isAnyOf } from '@reduxjs/toolkit';
import { A, F, G, pipe } from '@mobily/ts-belt';

import {
    createReducerWithExtraDeps,
    createWeakMapSelector,
    returnStableArrayIfEmpty,
} from '@suite-common/redux-utils';
import { enhanceHistory, isTestnet, isUtxoBased } from '@suite-common/wallet-utils';
import { Account, AccountKey } from '@suite-common/wallet-types';
import { type AccountType, networks, type NetworkSymbol } from '@suite-common/wallet-config';
import { DeviceState, StaticSessionId } from '@trezor/connect';

import { accountsActions } from './accountsActions';
import { formattedAccountTypeMap } from './accountsConstants';
import {
    DeviceRootState,
    selectSelectedDevice,
    selectDeviceState,
    selectHasOnlyPortfolioDevice,
} from '../device/deviceReducer';
import { deviceActions } from '../device/deviceActions';
import {
    DiscoveryRootState,
    selectHasDeviceDiscovery,
    selectIsDeviceDiscoveryActive,
} from '../discovery/discoveryReducer';

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

const createMemoizedSelector = createWeakMapSelector.withTypes<
    AccountsRootState & DeviceRootState & DiscoveryRootState
>();

const EMPTY_STABLE_ACCOUNTS_ARRAY: Account[] = [];

export const selectAccounts = (state: AccountsRootState) => state.wallet.accounts;

export const getAccountsByDeviceState = (
    accounts: Account[],
    deviceState: StaticSessionId | DeviceState,
) =>
    accounts.filter(account =>
        typeof deviceState === 'string'
            ? account.deviceState === deviceState
            : account.deviceState === deviceState.staticSessionId,
    );

export const selectAccountsByDeviceState = createMemoizedSelector(
    [
        selectAccounts,
        (_state: AccountsRootState, deviceState: StaticSessionId | DeviceState) => deviceState,
    ],
    (accounts, deviceState) =>
        pipe(getAccountsByDeviceState(accounts, deviceState), returnStableArrayIfEmpty),
);

export const selectAccountsByDeviceStateAndNetworkSymbol = createMemoizedSelector(
    [
        selectAccountsByDeviceState,
        (
            _state: AccountsRootState,
            _deviceState: StaticSessionId | DeviceState,
            symbol: NetworkSymbol,
        ) => symbol,
    ],
    (accounts, symbol) =>
        pipe(
            accounts,
            A.filter(account => account.symbol === symbol),
            returnStableArrayIfEmpty,
        ),
);

export const selectDeviceAccounts = createMemoizedSelector(
    [selectAccounts, selectSelectedDevice],
    (accounts, device) => {
        if (!device?.state?.staticSessionId) return EMPTY_STABLE_ACCOUNTS_ARRAY;

        return pipe(getAccountsByDeviceState(accounts, device.state), returnStableArrayIfEmpty);
    },
);

export const selectVisibleDeviceAccounts = createMemoizedSelector(
    [selectDeviceAccounts],
    accounts =>
        pipe(
            accounts,
            A.filter(account => account.visible),
            returnStableArrayIfEmpty,
        ),
);

export const selectDeviceAccountsForNetworkSymbolAndAccountType = createMemoizedSelector(
    [
        selectDeviceAccounts,
        (_state: AccountsRootState & DeviceRootState, symbol?: NetworkSymbol) => symbol,
        (
            _state: AccountsRootState & DeviceRootState,
            _symbol?: NetworkSymbol,
            accountType?: AccountType,
        ) => accountType,
    ],
    (accounts, symbol, accountType) => {
        if (!symbol || !accountType) return EMPTY_STABLE_ACCOUNTS_ARRAY;

        return pipe(
            accounts,
            A.filter(account => account.symbol === symbol && account.accountType === accountType),
            returnStableArrayIfEmpty,
        );
    },
);

export const selectDeviceAccountKeyForNetworkSymbolAndAccountTypeWithIndex = createMemoizedSelector(
    [
        selectDeviceAccountsForNetworkSymbolAndAccountType,
        (
            _state: AccountsRootState & DeviceRootState,
            _symbol?: NetworkSymbol,
            _accountType?: AccountType,
            accountIndex?: number,
        ) => accountIndex,
    ],
    (accounts, accountIndex) => {
        if (accountIndex === undefined || accountIndex < 0) return undefined;

        return accounts[accountIndex]?.key;
    },
);

export const selectDeviceMainnetAccounts = createMemoizedSelector(
    [selectDeviceAccounts],
    accounts =>
        pipe(
            accounts,
            A.filter(account => !isTestnet(account.symbol)),
            returnStableArrayIfEmpty,
        ),
);

export const selectNumberOfAccounts = createMemoizedSelector(
    [selectAccounts],
    accounts => accounts.length,
);

export const selectUserHasAccounts = createMemoizedSelector(
    [selectAccounts],
    accounts => accounts.length > 0,
);

export const selectAccountByKey = createMemoizedSelector(
    [selectAccounts, (_state: AccountsRootState, accountKey?: AccountKey) => accountKey],
    (accounts, accountKey) => {
        if (!accountKey) return null;

        return accounts.find(account => account.key === accountKey) ?? null;
    },
);

export const selectHasAccountTransactions = createMemoizedSelector(
    [selectAccountByKey],
    account => !!account?.history.total,
);

export const selectDeviceAccountsByNetworkSymbol = createMemoizedSelector(
    [
        selectDeviceAccounts,
        (_state: AccountsRootState & DeviceRootState, symbol: NetworkSymbol | null) => symbol,
    ],
    (accounts, symbol) => {
        if (G.isNull(symbol)) return EMPTY_STABLE_ACCOUNTS_ARRAY;

        return pipe(
            accounts,
            A.filter(account => account.symbol === symbol),
            returnStableArrayIfEmpty,
        );
    },
);

export const selectVisibleDeviceAccountsByNetworkSymbol = createMemoizedSelector(
    [selectDeviceAccountsByNetworkSymbol],
    accounts =>
        pipe(
            accounts,
            A.filter(account => account.visible),
            returnStableArrayIfEmpty,
        ),
);

export const selectVisibleNonEmptyDeviceAccountsByNetworkSymbol = createMemoizedSelector(
    [selectDeviceAccountsByNetworkSymbol],
    accounts =>
        pipe(
            accounts,
            A.filter(account => !account.empty || account.visible),
            returnStableArrayIfEmpty,
        ),
);

export const selectAllNetworkSymbolsOfVisibleAccounts = createMemoizedSelector(
    [selectAccounts],
    accounts =>
        pipe(
            accounts,
            A.filter(account => account.visible),
            A.map(account => account.symbol),
            A.uniq,
            F.toMutable,
        ),
);

export const selectNonEmptyDeviceAccounts = createMemoizedSelector(
    [selectDeviceAccounts],
    accounts =>
        pipe(
            accounts.filter(account => !account.empty),
            returnStableArrayIfEmpty,
        ),
);

export const selectAccountsByNetworkAndDeviceState = createMemoizedSelector(
    [
        selectAccounts,
        (_state: AccountsRootState, deviceState: StaticSessionId) => deviceState,
        (_state: AccountsRootState, _deviceState: StaticSessionId, symbol: NetworkSymbol) => symbol,
    ],
    (accounts, deviceState, symbol) =>
        pipe(
            accounts.filter(
                account => account.deviceState === deviceState && account.symbol === symbol,
            ),
            returnStableArrayIfEmpty,
        ),
);

export const selectFirstNormalAccountForNetworkSymbol = createMemoizedSelector(
    [
        (state: AccountsRootState & DeviceRootState, symbol: NetworkSymbol) =>
            selectDeviceAccountsForNetworkSymbolAndAccountType(state, symbol, 'normal'),
    ],
    accounts => accounts.find(account => account.index === 0) ?? null,
);

export const selectAccountLabel = createMemoizedSelector(
    [selectAccountByKey],
    account => account?.accountLabel ?? null,
);

export const selectAccountNetworkSymbol = createMemoizedSelector(
    [selectAccountByKey],
    account => account?.symbol ?? null,
);

export const selectAccountNetworkType = createMemoizedSelector(
    [selectAccountByKey],
    account => account?.networkType ?? null,
);

export const selectAccountBalance = createMemoizedSelector(
    [selectAccountByKey],
    account => account?.balance ?? null,
);

export const selectAccountFormattedBalance = createMemoizedSelector(
    [selectAccountByKey],
    account => account?.formattedBalance ?? null,
);

export const selectAccountAvailableBalance = createMemoizedSelector(
    [selectAccountByKey],
    account => account?.availableBalance ?? null,
);

export const selectFormattedAccountType = createMemoizedSelector([selectAccountByKey], account => {
    if (!account) return null;
    const { networkType, accountType } = account;
    const formattedType = formattedAccountTypeMap[networkType]?.[accountType];

    return formattedType ?? null;
});

export const selectIsAccountUtxoBased = createMemoizedSelector([selectAccountByKey], account =>
    account ? isUtxoBased(account) : false,
);

export const selectIsTestnetAccount = createMemoizedSelector([selectAccountByKey], account =>
    account ? isTestnet(account.symbol) : false,
);

export const selectDeviceAccountByDescriptorAndNetworkSymbol = createMemoizedSelector(
    [
        selectDeviceAccounts,
        (_state: AccountsRootState & DeviceRootState, accountDescriptor?: string) =>
            accountDescriptor,
        (
            _state: AccountsRootState & DeviceRootState,
            _accountDescriptor?: string,
            symbol?: NetworkSymbol,
        ) => symbol,
    ],
    (accounts, accountDescriptor, symbol) => {
        if (!accountDescriptor || !symbol) return null;

        return (
            accounts.find(
                account => account.descriptor === accountDescriptor && account.symbol === symbol,
            ) ?? null
        );
    },
);

export const selectDeviceAccountKeyByDescriptorAndNetworkSymbol = createMemoizedSelector(
    [selectDeviceAccountByDescriptorAndNetworkSymbol],
    account => account?.key ?? null,
);

export const selectAccountsSymbols = createMemoizedSelector([selectAccounts], accounts =>
    pipe(
        accounts,
        A.map(a => a.symbol),
        A.uniq,
        returnStableArrayIfEmpty,
    ),
);

export const selectIsDeviceAccountless = createMemoizedSelector(
    [selectVisibleDeviceAccounts],
    accounts => accounts.length === 0,
);

export const selectIsDiscoveredDeviceAccountless = createMemoizedSelector(
    [selectIsDeviceAccountless, selectIsDeviceDiscoveryActive],
    (isAccountless, isDiscoveryActive) => isAccountless && !isDiscoveryActive,
);

export const selectHasOnlyEmptyPortfolioTracker = createMemoizedSelector(
    [selectIsDiscoveredDeviceAccountless, selectHasOnlyPortfolioDevice],
    (isDiscoveredAccountless, hasOnlyPortfolio) => isDiscoveredAccountless && hasOnlyPortfolio,
);

export const selectIsDeviceNotEmpty = createMemoizedSelector(
    [selectNonEmptyDeviceAccounts, selectHasDeviceDiscovery, selectDeviceState],
    (nonEmptyAccounts, hasDiscovery, deviceState) => {
        const isNotEmpty = nonEmptyAccounts.length > 0;
        if (isNotEmpty) return true;
        if (hasDiscovery || !deviceState) return null;

        return isNotEmpty;
    },
);

export const selectStakingAccounts = createMemoizedSelector([selectAccountByKey], account => {
    if (!account) return null;

    return account.stakingAccounts ?? null;
});
