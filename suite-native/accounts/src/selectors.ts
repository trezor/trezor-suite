import { A, D, pipe } from '@mobily/ts-belt';
import { memoizeWithArgs } from 'proxy-memoize';

import {
    AccountsRootState,
    DeviceRootState,
    selectAccounts,
    selectVisibleDeviceAccountsByNetworkSymbol,
    selectVisibleDeviceAccounts,
    FiatRatesRootState,
} from '@suite-common/wallet-core';
import { SettingsSliceRootState } from '@suite-native/settings';
import { NetworkSymbol, networks } from '@suite-common/wallet-config';

import { GroupedAccounts } from './types';
import {
    filterAccountsByLabelAndNetworkNames,
    groupAccountsByNetworkAccountType,
    sortAccountsByNetworksAndAccountTypes,
} from './utils';

// TODO: It searches for filterValue even in tokens without fiat rates.
// These are currently hidden in UI, but they should be made accessible in some way.
export const selectFilteredDeviceAccountsGroupedByNetworkAccountType = memoizeWithArgs(
    (
        state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState & DeviceRootState,
        filterValue: string,
    ) => {
        const accounts = selectVisibleDeviceAccounts(state);

        return pipe(
            accounts,
            sortAccountsByNetworksAndAccountTypes,
            accountsSorted => filterAccountsByLabelAndNetworkNames(accountsSorted, filterValue),
            groupAccountsByNetworkAccountType,
        ) as GroupedAccounts;
    },
    // This selector is used only in one search component, so cache size equal to 1 is enough.
    { size: 1 },
);

export const selectDeviceNetworkAccountsGroupedByAccountType = memoizeWithArgs(
    (state: AccountsRootState & DeviceRootState, networkSymbol: NetworkSymbol) =>
        pipe(
            selectVisibleDeviceAccountsByNetworkSymbol(state, networkSymbol),
            sortAccountsByNetworksAndAccountTypes,
            groupAccountsByNetworkAccountType,
        ) as GroupedAccounts,
    { size: D.keys(networks).length },
);

export const selectIsAccountAlreadyDiscovered = (
    state: AccountsRootState,
    {
        networkSymbol,
        path,
        deviceState,
    }: { networkSymbol: NetworkSymbol; path: string; deviceState: string },
) =>
    pipe(
        state,
        selectAccounts,
        A.any(
            account =>
                account.symbol === networkSymbol &&
                account.path === path &&
                account.deviceState === deviceState,
        ),
    );
