import { A, D, pipe } from '@mobily/ts-belt';
import { memoizeWithArgs } from 'proxy-memoize';

import {
    AccountsRootState,
    DeviceRootState,
    selectAccounts,
    selectDeviceAccountsByNetworkSymbol,
    selectDeviceAccounts,
    FiatRatesRootState,
} from '@suite-common/wallet-core';
import { TokenInfoBranded } from '@suite-common/wallet-types';
import { selectEthereumAccountsTokensWithFiatRates } from '@suite-native/ethereum-tokens';
import { SettingsSliceRootState } from '@suite-native/module-settings';
import { NetworkSymbol, networks } from '@suite-common/wallet-config';

import { GroupedAccounts } from './types';
import {
    filterAccountsByLabelAndNetworkNames,
    groupAccountsByNetworkAccountType,
    sortAccountsByNetworksAndAccountTypes,
} from './utils';

export const selectFilteredDeviceAccountsGroupedByNetworkAccountType = memoizeWithArgs(
    (
        state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState & DeviceRootState,
        filterValue: string,
    ) => {
        const accounts = selectDeviceAccounts(state);

        return pipe(
            accounts,
            sortAccountsByNetworksAndAccountTypes,
            A.map(account => ({
                ...account,
                // Select only tokens with fiat rates To apply filter only one those tokens later.
                tokens: selectEthereumAccountsTokensWithFiatRates(
                    state,
                    account.key,
                ) as TokenInfoBranded[],
            })),
            accountsWithFiatRatedTokens =>
                filterAccountsByLabelAndNetworkNames(accountsWithFiatRatedTokens, filterValue),
            groupAccountsByNetworkAccountType,
        ) as GroupedAccounts;
    },
    // This selector is used only in one search component, so cache size equal to 1 is enough.
    { size: 1 },
);

export const selectDeviceNetworkAccountsGroupedByAccountType = memoizeWithArgs(
    (state: AccountsRootState & DeviceRootState, networkSymbol: NetworkSymbol) =>
        pipe(
            selectDeviceAccountsByNetworkSymbol(state, networkSymbol),
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
