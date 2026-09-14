import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigDeps } from '@suite-common/networks';
import { accountSearchFn } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { globalSendReceiveFiltersSelectors } from 'src/slices/wallet/globalSendReceiveFilters';

import { type AccountOption } from './useAccountsOptions';

export function useFilterAccounts(accounts: AccountOption[]) {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const { search, networkSymbol } = useSelector(globalSendReceiveFiltersSelectors.selectFilters);

    return useMemo(
        () =>
            accounts.filter(account =>
                search || networkSymbol
                    ? accountSearchFn(networkConfigDeps, account.account, search, {
                          coinsFilter: networkSymbol,
                          accountLabel: account.account.label ?? '',
                      })
                    : true,
            ),
        [networkConfigDeps, accounts, networkSymbol, search],
    );
}
