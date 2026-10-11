import { useMemo } from 'react';

import { getDefaultAccountLabel } from '@suite/account';
import { useTranslation } from '@suite/intl';
import { selectAccountLabelsLegacy } from '@suite/metadata';
import { type AccountKey } from '@suite-common/wallet-types';
import { accountSearchFn, isTokenMatchesSearch } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

import { type AccountWithOptionalLabel, type AccountWithTokensOption } from '../types';

export type FilterAccountsWithTokensParams = {
    accountsWithTokens: AccountWithTokensOption[];
    search: string;
    getAccountLabel: (account: AccountWithOptionalLabel) => string;
    shouldKeepAccountWithMatchedToken: boolean;
};

export const filterAccountsWithTokens = ({
    accountsWithTokens,
    search,
    getAccountLabel,
    shouldKeepAccountWithMatchedToken,
}: FilterAccountsWithTokensParams): AccountWithTokensOption[] => {
    if (!search) {
        return accountsWithTokens;
    }

    const matchedAccountKeys = new Set<AccountKey>();
    const accountKeysWithMatchedToken = new Set<AccountKey>();

    for (const item of accountsWithTokens) {
        switch (item.type) {
            case 'account':
                if (
                    accountSearchFn(item.account, search, {
                        tokensMatch: false,
                        accountLabel: getAccountLabel(item.account),
                    })
                ) {
                    matchedAccountKeys.add(item.account.key);
                }
                break;

            case 'token':
                if (isTokenMatchesSearch(item.token, search)) {
                    accountKeysWithMatchedToken.add(item.account.key);
                }
                break;

            case 'hidden-tokens':
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
                    return (
                        accountMatched ||
                        (shouldKeepAccountWithMatchedToken &&
                            accountKeysWithMatchedToken.has(item.account.key))
                    );

                case 'token':
                    return accountMatched || isTokenMatchesSearch(item.token, search);

                case 'hidden-tokens':
                    return (
                        accountMatched ||
                        item.tokens.some(token => isTokenMatchesSearch(token, search))
                    );
            }
        })
        .map(item => {
            if (item.type === 'hidden-tokens' && !matchedAccountKeys.has(item.account.key)) {
                return {
                    ...item,
                    tokens: item.tokens.filter(token => isTokenMatchesSearch(token, search)),
                };
            }

            return item;
        });
};

export type UseFilterAccountsWithTokensParams = {
    accountsWithTokens: AccountWithTokensOption[];
    search: string;
    shouldKeepAccountWithMatchedToken?: boolean;
};

export function useFilterAccountsWithTokens({
    accountsWithTokens,
    search,
    shouldKeepAccountWithMatchedToken = true,
}: UseFilterAccountsWithTokensParams) {
    const { translationString } = useTranslation();
    const accountLegacyLabels = useSelector(selectAccountLabelsLegacy);

    return useMemo(
        () =>
            filterAccountsWithTokens({
                accountsWithTokens,
                search,
                getAccountLabel: account =>
                    account.label ??
                    accountLegacyLabels[account.key] ??
                    getDefaultAccountLabel(translationString, account) ??
                    '',
                shouldKeepAccountWithMatchedToken,
            }),
        [
            accountLegacyLabels,
            accountsWithTokens,
            search,
            shouldKeepAccountWithMatchedToken,
            translationString,
        ],
    );
}
