import { type ReactNode } from 'react';

import {
    type TokenMetadata,
    TokenMetadataProvider,
    type TokenMetadataSource,
} from '@suite-common/token';
import { type RankedTokenStructure } from '@suite-common/token-definitions';
import { toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, getMainnets } from '@suite-common/wallet-config';

import { useRankedTokenDefinitions } from '../hooks/useRankedTokenDefinitions';

const rankedTokenDefinitionsToTokenMetadataSources = (
    definitions: RankedTokenStructure,
): TokenMetadataSource[] => {
    const networkSymbolsByPlatform = new Map(
        getMainnets().map(network => [network.coingeckoId, network.symbol]),
    );
    const tokensByNetwork = new Map<NetworkSymbol, TokenMetadata[]>();

    for (const token of definitions) {
        const networkSymbol = networkSymbolsByPlatform.get(token.assetPlatformId);
        if (!networkSymbol) continue;

        const tokens = tokensByNetwork.get(networkSymbol) ?? [];
        tokens.push({
            contract: toTokenAddress(token.address),
            name: token.name,
            symbol: token.symbol.toUpperCase(),
        });
        tokensByNetwork.set(networkSymbol, tokens);
    }

    return Array.from(tokensByNetwork, ([networkSymbol, tokens]) => ({ networkSymbol, tokens }));
};

type ReceiveTokenMetadataProviderProps = {
    children: ReactNode;
};

/**
 * Provides the tokens Receive lists, so a token the user does not hold has a name and symbol.
 * It never downloads them itself: it exposes what the Receive list loaded, converted once per load.
 */
export const ReceiveTokenMetadataProvider = ({ children }: ReceiveTokenMetadataProviderProps) => {
    const { data: sources } = useRankedTokenDefinitions({
        isFetchEnabled: false,
        select: rankedTokenDefinitionsToTokenMetadataSources,
    });

    return <TokenMetadataProvider sources={sources ?? []}>{children}</TokenMetadataProvider>;
};
