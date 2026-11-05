import { type ReactNode, useContext } from 'react';

import { type NetworkSymbol } from '@trezor/network-module-types';

import {
    type TokenMetadata,
    TokenMetadataContext,
    type TokenMetadataSource,
} from './TokenMetadataContext';

type TokenMetadataProviderProps = {
    sources: readonly TokenMetadataSource[];
    children: ReactNode;
};

/** Supplies complete source collections before token data enters presentation components. */
export const TokenMetadataProvider = ({ sources, children }: TokenMetadataProviderProps) => {
    const parent = useContext(TokenMetadataContext);
    const tokensByNetwork = new Map(parent.tokensByNetwork);
    const localNetworks = new Map<NetworkSymbol, Map<string, TokenMetadata>>();

    // Index each collection once; rows and formatters must not scan a catalog for every amount.
    // Earlier sources and nearer providers take precedence over inherited metadata.
    for (const source of sources.toReversed()) {
        let tokens = localNetworks.get(source.networkSymbol);
        if (!tokens) {
            tokens = new Map(parent.tokensByNetwork.get(source.networkSymbol));
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

    return (
        <TokenMetadataContext
            value={{
                sources: [...new Set([...sources, ...parent.sources])],
                tokensByNetwork,
            }}
        >
            {children}
        </TokenMetadataContext>
    );
};
