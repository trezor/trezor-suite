import { useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import { type TradingAssetOption } from '@suite-common/trading';
import { exhaustive } from '@trezor/type-utils';

import { type AccountWithTokensOption } from '../types';
import { useTokenDisplaySymbolNames } from './useTokenDisplaySymbolNames';
import { type TokenDisplayNameSource, getTokenDisplaySymbolName } from '../utils/tokenDisplayNames';

export const getTokenDisplayNameSources = (accountsWithTokens: AccountWithTokensOption[]) => {
    const tokens: TokenDisplayNameSource[] = [];

    for (const item of accountsWithTokens) {
        switch (item.type) {
            case 'account':
                break;
            case 'token':
                tokens.push({ account: item.account, token: item.token });
                break;
            case 'hidden-tokens':
            case 'non-tradable-tokens':
                item.tokens.forEach(token => {
                    tokens.push({ account: item.account, token });
                });
                break;
            default:
                exhaustive(item);
        }
    }

    return tokens;
};

export const getAccountsWithTokenDisplayNames = (
    accountsWithTokens: AccountWithTokensOption[],
    tokenDisplaySymbolNames: Map<CryptoId, string>,
) =>
    accountsWithTokens.map(item => {
        switch (item.type) {
            case 'account':
                return item;
            case 'token':
                return {
                    ...item,
                    token: {
                        ...item.token,
                        name: getTokenDisplaySymbolName({
                            tokenDisplaySymbolNames,
                            account: item.account,
                            token: item.token,
                        }),
                    },
                };
            case 'hidden-tokens':
            case 'non-tradable-tokens':
                return {
                    ...item,
                    tokens: item.tokens.map(token => ({
                        ...token,
                        name: getTokenDisplaySymbolName({
                            tokenDisplaySymbolNames,
                            account: item.account,
                            token,
                        }),
                    })),
                };
            default:
                return exhaustive(item);
        }
    });

export const useAccountsWithTokenDisplayNames = (
    accountsWithTokens: AccountWithTokensOption[],
    assets?: TradingAssetOption[],
) => {
    const tokens = useMemo(
        () => getTokenDisplayNameSources(accountsWithTokens),
        [accountsWithTokens],
    );
    const tokenDisplaySymbolNames = useTokenDisplaySymbolNames(tokens, assets);

    return useMemo(
        () => getAccountsWithTokenDisplayNames(accountsWithTokens, tokenDisplaySymbolNames),
        [accountsWithTokens, tokenDisplaySymbolNames],
    );
};
