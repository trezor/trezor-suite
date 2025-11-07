import { useMemo } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { accountSearchFn } from '@suite-common/wallet-utils';

import { AccountOption } from './useAccountsOptions';

interface AccountsFilters {
    networkSymbol?: NetworkSymbol;
    search: string;
}

export function useFilterAccounts(
    accounts: AccountOption[],
    { networkSymbol, search }: AccountsFilters,
) {
    return useMemo(
        () =>
            accounts
                .filter(account =>
                    networkSymbol ? account.account.symbol === networkSymbol : true,
                )
                .filter(account => (search ? accountSearchFn(account.account, search) : true)),
        [accounts, networkSymbol, search],
    );
}

export type FilteredAccountOption = ReturnType<typeof useFilterAccounts>[number];
