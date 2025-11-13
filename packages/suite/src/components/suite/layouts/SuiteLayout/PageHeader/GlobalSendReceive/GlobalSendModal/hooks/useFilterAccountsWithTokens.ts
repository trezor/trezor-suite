import { useMemo } from 'react';

import { accountSearchFn, isTokenMatchesSearch } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';

import { AccountWithTokensOption } from './useAccountWithTokensOptions';

export function useFilterAccountsWithTokens(accountsWithTokens: AccountWithTokensOption[]) {
    const search = useSelector(globalSendReceiveFilters.selectors.selectSearch);

    return useMemo(
        () =>
            accountsWithTokens.filter(accountOrToken => {
                if (!search) {
                    return true;
                }

                switch (accountOrToken.type) {
                    case 'account':
                        return accountSearchFn(accountOrToken.account, search);

                    case 'token':
                        return isTokenMatchesSearch(accountOrToken.token, search);
                }
            }),
        [accountsWithTokens, search],
    );
}
