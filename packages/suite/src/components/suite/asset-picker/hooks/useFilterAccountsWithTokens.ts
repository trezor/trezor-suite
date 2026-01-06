import { useMemo } from 'react';

import { accountSearchFn, isTokenMatchesSearch } from '@suite-common/wallet-utils';

import { AccountWithTokensOption } from './useInsertGroupLabelsAndSpaces';

export function useFilterAccountsWithTokens(
    accountsWithTokens: AccountWithTokensOption[],
    search: string,
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
