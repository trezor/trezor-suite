import { A, pipe } from '@mobily/ts-belt';
import { memoizeWithArgs } from 'proxy-memoize';

import { AccountsRootState, selectAccounts, selectDeviceAccounts } from '@suite-common/wallet-core';
import { Account, TokenInfoBranded } from '@suite-common/wallet-types';
import { getNetwork } from '@suite-common/wallet-utils';
import { selectEthereumAccountsTokensWithFiatRates } from '@suite-native/ethereum-tokens';
import { FiatRatesRootState } from '@suite-native/fiat-rates';
import { SettingsSliceRootState } from '@suite-native/module-settings';
import { NetworkSymbol } from '@suite-common/wallet-config';

/**
 * Returns true if account label, network name or account included token contains filter value as a substring.
 */
export const isFilterValueMatchingAccount = (account: Account, filterValue: string) => {
    const lowerCaseFilterValue = filterValue?.trim().toLowerCase();

    const isMatchingLabel = account.accountLabel?.toLowerCase().includes(lowerCaseFilterValue);

    if (isMatchingLabel) return true;

    const accountNetwork = getNetwork(account.symbol);
    const isMatchingNetworkName = accountNetwork?.name.toLowerCase().includes(lowerCaseFilterValue);

    if (isMatchingNetworkName) return true;

    const isMatchingTokenName =
        account.tokens?.some(token => token.name?.toLowerCase().includes(lowerCaseFilterValue)) ??
        false;

    if (isMatchingTokenName) return true;

    return false;
};

/**
 * Filter accounts by labels, network names and included token names.
 */
const filterAccountsByLabelAndNetworkNames = (
    accounts: readonly Account[],
    filterValue: string,
) => {
    if (!filterValue) return accounts;

    return A.filter(accounts, account => isFilterValueMatchingAccount(account, filterValue));
};

export const selectFilteredAccountsGroupedByNetwork = memoizeWithArgs(
    (
        state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState,
        filterValue: string,
    ) => {
        const accounts = selectDeviceAccounts(state);

        return pipe(
            accounts,
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
            A.groupBy(account => account.symbol),
        );
    },
    // This selector is used only in one search component, so cache size equal to 1 is enough.
    { size: 1 },
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
