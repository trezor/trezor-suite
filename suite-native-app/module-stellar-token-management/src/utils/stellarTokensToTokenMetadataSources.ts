import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type StellarTokenInfo } from '@suite-common/wallet-types';

export const stellarTokensToTokenMetadataSources = (
    networkSymbol: NetworkSymbol,
    tokens: readonly StellarTokenInfo[],
): TokenMetadataSource[] => [
    {
        networkSymbol,
        tokens: tokens.map(token => ({ ...token, contract: toTokenAddress(token.contract) })),
    },
];
