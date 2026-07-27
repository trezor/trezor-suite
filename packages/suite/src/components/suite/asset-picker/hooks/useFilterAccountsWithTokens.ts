import { useMemo } from 'react';

import { getDefaultAccountLabel } from '@suite/account';
import { useTranslation } from '@suite/intl';
import { selectAccountLabelsLegacy } from '@suite/metadata';
import { type AccountKey } from '@suite-common/wallet-types';
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

    return useMemo(() => {
        if (!search) {
            return accountsWithTokens;
        }

        // An account row matches the search by its symbol, network name, account
        // number or label. A token row matches by its own name/symbol/contract.
        // To keep the grouped list consistent: an account that matches keeps all of
        // its tokens, while a token that matches keeps its parent account row (so
        // tokens are never orphaned and accounts never hide their matching tokens).
        const matchedAccountKeys = new Set<AccountKey>();
        const accountKeysWithMatchedToken = new Set<AccountKey>();

        for (const item of accountsWithTokens) {
            switch (item.type) {
                case 'account': {
                    const { key } = item.account;

                    const accountLabel =
                        item.account.label ??
                        accountLegacyLabels[key] ??
                        getDefaultAccountLabel(translationString, item.account) ??
                        '';

                    if (
                        accountSearchFn(item.account, search, {
                            tokensMatch: false,
                            accountLabel,
                        })
                    ) {
                        matchedAccountKeys.add(key);
                    }
                    break;
                }

                case 'token':
                    if (isTokenMatchesSearch(item.token, search)) {
                        accountKeysWithMatchedToken.add(item.account.key);
                    }
                    break;

                case 'hidden-tokens':
                case 'non-tradable-tokens':
                    if (item.tokens.some(token => isTokenMatchesSearch(token, search))) {
                        accountKeysWithMatchedToken.add(item.account.key);
                    }
                    break;
            }
        }

        return accountsWithTokens
            .filter(item => {
                const accountMatched = matchedAccountKeys.has(item.account.key);

                switch (item.type) {
                    case 'account':
                        return accountMatched || accountKeysWithMatchedToken.has(item.account.key);

                    case 'token':
                        return accountMatched || isTokenMatchesSearch(item.token, search);

                    case 'hidden-tokens':
                    case 'non-tradable-tokens':
                        return (
                            accountMatched ||
                            item.tokens.some(token => isTokenMatchesSearch(token, search))
                        );
                }
            })
            .map(item => {
                if (
                    (item.type === 'hidden-tokens' || item.type === 'non-tradable-tokens') &&
                    !matchedAccountKeys.has(item.account.key)
                ) {
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
            });
    }, [accountLegacyLabels, accountsWithTokens, search, translationString]);
}
