import { useMemo } from 'react';

import { getDefaultAccountLabel } from '@suite/account';
import { useTranslation } from '@suite/intl';
import { selectAccountLabelsLegacy } from '@suite/metadata';
import { accountSearchFn, isTokenMatchesSearch } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

import { type AccountWithTokensOption } from '../types';
import { calculateExpandableTokensHeight } from '../utils';

export function useFilterAccountsWithTokens(
    accountsWithTokens: AccountWithTokensOption[],
    search: string,
) {
    const { translationString } = useTranslation();
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
                            const { key } = item.account;

                            const accountLabel =
                                item.account.label ??
                                (Object.prototype.hasOwnProperty.call(accountLegacyLabels, key)
                                    ? accountLegacyLabels[key]
                                    : getDefaultAccountLabel(translationString, item.account)) ??
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
        [accountLegacyLabels, accountsWithTokens, search, translationString],
    );
}
