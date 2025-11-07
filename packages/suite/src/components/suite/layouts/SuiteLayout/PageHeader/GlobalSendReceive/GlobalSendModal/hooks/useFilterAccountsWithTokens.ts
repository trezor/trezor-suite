import { useMemo } from 'react';

import { accountSearchFn, isTokenMatchesSearch } from '@suite-common/wallet-utils';

import { AccountWithTokensOption } from './useAccountWithTokensOptions';

interface AccountsFilters {
    search: string;
}

export function useFilterAccountsWithTokens(
    accountsWithTokens: AccountWithTokensOption[],
    { search }: AccountsFilters,
) {
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
