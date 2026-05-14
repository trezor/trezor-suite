import { useMemo } from 'react';

import { selectAccountLabelsLegacy } from '@suite/metadata';
import { accountSearchFn, isTokenMatchesSearch } from '@suite-common/wallet-utils';

import { useDefaultAccountLabel, useSelector } from 'src/hooks/suite';

import { type AccountWithTokensOption } from '../types';
import { calculateExpandableTokensHeight } from '../utils';

export function useFilterAccountsWithTokens(
    accountsWithTokens: AccountWithTokensOption[],
    search: string,
) {
    const { getDefaultAccountLabel } = useDefaultAccountLabel();
    const accountLegacyLabels = useSelector(selectAccountLabelsLegacy);

    return useMemo(
        () =>
            accountsWithTokens
                .filter(item => {
                    if (!search) {
                        return true;
                    }

                    switch (item.type) {
                        case 'account': {
                            const { accountType, symbol, index, key } = item.account;

                            const accountLabel =
                                item.account.label ??
                                (Object.prototype.hasOwnProperty.call(accountLegacyLabels, key)
                                    ? accountLegacyLabels[key]
                                    : getDefaultAccountLabel({ accountType, symbol, index })) ??
                                '';

                            return accountSearchFn(item.account, search, {
                                tokensMatch: false,
                                accountLabel,
                            });
                        }

                        case 'token':
                            return isTokenMatchesSearch(item.token, search);

                        case 'hidden-tokens':
                        case 'non-tradable-tokens':
                            return item.tokens.some(token => isTokenMatchesSearch(token, search));
                    }
                })
                .map(item => {
                    if (item.type === 'hidden-tokens' || item.type === 'non-tradable-tokens') {
                        const matchedTokens = item.tokens.filter(token =>
                            isTokenMatchesSearch(token, search),
                        );

                        return {
                            ...item,
                            tokens: matchedTokens,
                            // Update height based on matched tokens count
                            height: calculateExpandableTokensHeight(
                                item.expanded,
                                matchedTokens.length,
                            ),
                        };
                    }

                    return item;
                }),
        [accountLegacyLabels, accountsWithTokens, getDefaultAccountLabel, search],
    );
}
