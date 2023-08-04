import { A, pipe } from '@mobily/ts-belt';
import { memoizeWithArgs } from 'proxy-memoize';

import { AccountsRootState, selectAccounts } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { getNetwork } from '@suite-common/wallet-utils';

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
const filterAccountsByLabelAndNetworkNames = (accounts: Account[], filterValue?: string | null) => {
    if (!filterValue) return accounts;

    return A.filter(accounts, account => isFilterValueMatchingAccount(account, filterValue));
};

export const selectFilteredAccountsGroupedByNetwork = memoizeWithArgs(
    (state: AccountsRootState, filterValue?: string | null) => {
        const accounts = selectAccounts(state);

        return pipe(
            filterAccountsByLabelAndNetworkNames(accounts, filterValue),
            A.groupBy(account => account.symbol),
        );
    },
    // This selector is used only in one search component, so cache size equal to 1 is enough.
    { size: 1 },
);
