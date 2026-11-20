import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type Account } from '@suite-common/wallet-types';

export const accountsToTokenMetadataSources = (
    accounts: readonly Account[],
): TokenMetadataSource[] =>
    accounts.map(account => ({
        networkSymbol: account.symbol,
        tokens: (account.tokens ?? []).map(token => ({
            ...token,
            contract: toTokenAddress(token.contract),
        })),
    }));
