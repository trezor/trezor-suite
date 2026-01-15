import { useMemo } from 'react';

import { accountSearchFn, isTokenMatchesSearch } from '@suite-common/wallet-utils';

import { AccountWithTokensOption } from '../types';
import { calculateHiddenTokensHeight } from '../utils';

export function useFilterAccountsWithTokens(
    accountsWithTokens: AccountWithTokensOption[],
    search: string,
) {
    return useMemo(
        () =>
            accountsWithTokens
                .filter(item => {
                    if (!search) {
                        return true;
                    }

                    switch (item.type) {
                        case 'account':
                            return accountSearchFn(item.account, search, {
                                tokensMatch: false,
                            });

                        case 'token':
                            return isTokenMatchesSearch(item.token, search);

                        case 'hidden-tokens':
                            return item.tokens.some(token => isTokenMatchesSearch(token, search));
                    }
                })
                .map(item => {
                    if (item.type === 'hidden-tokens') {
                        const matchedTokens = item.tokens.filter(token =>
                            isTokenMatchesSearch(token, search),
                        );

                        return {
                            ...item,
                            tokens: matchedTokens,
                            // Update height based on matched tokens count
                            height: calculateHiddenTokensHeight(
                                item.expanded,
                                matchedTokens.length,
                            ),
                        };
                    }

                    return item;
                }),
        [accountsWithTokens, search],
    );
}
