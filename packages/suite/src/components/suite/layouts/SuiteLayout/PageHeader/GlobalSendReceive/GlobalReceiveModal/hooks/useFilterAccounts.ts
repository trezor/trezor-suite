import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { accountSearchFn } from '@suite-common/wallet-utils';

import { type AccountOption } from './useAccountsOptions';
import { globalSendReceiveFiltersSelectors } from '../../../../../../../../slices/wallet/globalSendReceiveFilters';

export function useFilterAccounts(accounts: AccountOption[]) {
    const search = useSelector(globalSendReceiveFiltersSelectors.selectSearch);
    const networkSymbol = useSelector(globalSendReceiveFiltersSelectors.selectNetworkSymbol);

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
