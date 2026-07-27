import { useMemo } from 'react';

import { accountSearchFn } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { globalSendReceiveFiltersSelectors } from 'src/slices/wallet/globalSendReceiveFilters';

import { type AccountOption } from './useAccountsOptions';

export function useFilterAccounts(accounts: AccountOption[]) {
    const { search, networkSymbol } = useSelector(globalSendReceiveFiltersSelectors.selectFilters);

    return useMemo(
        () =>
            accounts.filter(account =>
                search || networkSymbol
                    ? accountSearchFn(account.account, search, {
                          coinsFilter: networkSymbol,
                          accountLabel: account.account.label ?? '',
                      })
                    : true,
            ),
        [accounts, networkSymbol, search],
    );
}

export type FilteredAccountOption = ReturnType<typeof useFilterAccounts>[number];
