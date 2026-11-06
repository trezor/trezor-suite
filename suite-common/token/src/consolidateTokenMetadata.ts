import { type NetworkSymbol } from '@trezor/network-module-types';

import {
    type TokenMetadata,
    type TokenMetadataByNetwork,
    type TokenMetadataSource,
} from './TokenMetadataContext';

type ConsolidateTokenMetadataParams = {
    sources: readonly TokenMetadataSource[];
    parentTokensByNetwork: TokenMetadataByNetwork;
};

/** Merges sources by priority, inheriting missing fields without mutating the inputs. */
export const consolidateTokenMetadata = ({
    sources,
    parentTokensByNetwork,
}: ConsolidateTokenMetadataParams): TokenMetadataByNetwork => {
    const tokensByNetwork = new Map(parentTokensByNetwork);
    const localNetworks = new Map<NetworkSymbol, Map<string, TokenMetadata>>();

    // Index each collection once; rows and formatters must not scan a catalog for every amount.
    // Earlier sources and nearer providers take precedence over inherited metadata.
    for (const source of sources.toReversed()) {
        let tokens = localNetworks.get(source.networkSymbol);
        if (!tokens) {
            tokens = new Map(parentTokensByNetwork.get(source.networkSymbol));
            localNetworks.set(source.networkSymbol, tokens);
            tokensByNetwork.set(source.networkSymbol, tokens);
        }
        for (const token of source.tokens.toReversed()) {
            const inherited = tokens.get(token.contract);
            tokens.set(token.contract, {
                contract: token.contract,
                name: token.name ?? inherited?.name,
                symbol: token.symbol ?? inherited?.symbol,
                decimals: token.decimals ?? inherited?.decimals,
                standard: token.standard ?? inherited?.standard,
            });
        }
    }

    return tokensByNetwork;
};
