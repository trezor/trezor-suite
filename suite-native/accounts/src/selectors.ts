import { A, D, pipe } from '@mobily/ts-belt';
import { memoizeWithArgs } from 'proxy-memoize';

import {
    AccountsRootState,
    DeviceRootState,
    selectAccounts,
    selectVisibleDeviceAccountsByNetworkSymbol,
    selectVisibleDeviceAccounts,
    FiatRatesRootState,
    selectCurrentFiatRates,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { SettingsSliceRootState, selectFiatCurrencyCode } from '@suite-native/settings';
import { NetworkSymbol, networks } from '@suite-common/wallet-config';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';

import { GroupedByTypeAccounts } from './types';
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
        ) as GroupedByTypeAccounts;
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
        ) as GroupedByTypeAccounts,
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

export const selectAccountFiatBalance = (
    state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState,
    accountKey: string,
) => {
    const fiatRates = selectCurrentFiatRates(state);
    const account = selectAccountByKey(state, accountKey);
    const localCurrency = selectFiatCurrencyCode(state);

    if (!account) {
        return '0';
    }

    // Staking should be true once we support it in Trezor Suite Lite
    const totalBalance = getAccountFiatBalance({
        account,
        rates: fiatRates,
        localCurrency,
        shouldIncludeStaking: false,
    });

    return totalBalance;
};
