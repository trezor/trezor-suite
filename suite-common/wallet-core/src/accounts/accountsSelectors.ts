import { A, F, G, pipe } from '@mobily/ts-belt';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type AccountType, type Bip43Path, type NetworkSymbol } from '@suite-common/wallet-config';
import { Account, AccountKey } from '@suite-common/wallet-types';
import { isTestnet, isUtxoBased } from '@suite-common/wallet-utils';
import { DeviceState, StaticSessionId } from '@trezor/connect';

import { formattedAccountTypeMap } from './accountsConstants';
import { AccountsRootState } from './accountsReducer';
import { DeviceRootState } from '../device/deviceReducer';
import { selectSelectedDevice } from '../device/deviceSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<
    AccountsRootState & DeviceRootState
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

export const selectVisibleSortedDeviceAccounts = createMemoizedSelector(
    [selectVisibleDeviceAccounts],
    accounts =>
        pipe(
            accounts,
            A.sortBy(a => a.index),
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

// CAUTION!: This selector does not work for XRP accounts! It should be used only for Bitcoin-like accounts.
// Ripple backend does not provide the total transaction count info.
// The property`account.history.total` is always equal to -1 for XRP accounts.
export const selectHasAccountTransactionHistory = createMemoizedSelector(
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

export const selectAccountForNetworkSymbolAndPath = createMemoizedSelector(
    [
        selectAccounts,
        (_state: AccountsRootState, networkSymbol: NetworkSymbol) => networkSymbol,
        (_state: AccountsRootState, _networkSymbol: NetworkSymbol, path: Bip43Path) => path,
    ],
    (accounts, networkSymbol, path) =>
        accounts.find(account => path === account.path && networkSymbol === account.symbol) ?? null,
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

export const selectSolStakingAccounts = createMemoizedSelector([selectAccountByKey], account => {
    if (!account?.misc || account.networkType !== 'solana') return null;

    return account.misc.solStakingAccounts ?? [];
});

export const selectSolAccountHasStaked = createMemoizedSelector([selectAccountByKey], account => {
    if (!account?.misc || account.networkType !== 'solana') return false;

    return !!account.misc.solStakingAccounts?.length;
});
