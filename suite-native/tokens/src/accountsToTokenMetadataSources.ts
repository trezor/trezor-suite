import { type Account } from '@suite-common/wallet-types';

import { type TokenMetadataSource } from './TokenMetadataContext';

export const accountsToTokenMetadataSources = (
    accounts: readonly Account[],
): TokenMetadataSource[] =>
    accounts.map(account => ({
        networkSymbol: account.symbol,
        tokens: account.tokens ?? [],
    }));
