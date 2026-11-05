import { type ReactNode, useContext } from 'react';

import { type NetworkSymbol } from '@trezor/network-module-types';

import { type TokenMetadata, TokenMetadataContext } from './TokenMetadataContext';

type TokenMetadataProviderProps = {
    networkSymbol: NetworkSymbol;
    tokens: readonly TokenMetadata[];
    children: ReactNode;
};

/** Supplies source metadata for previews and historical tokens outside the account store. */
export const TokenMetadataProvider = ({
    networkSymbol,
    tokens,
    children,
}: TokenMetadataProviderProps) => {
    const resolveParentMetadata = useContext(TokenMetadataContext);

    return (
        <TokenMetadataContext
            value={(requestedNetwork, contractAddress) =>
                (requestedNetwork === networkSymbol
                    ? tokens.find(token => token.contract === contractAddress)
                    : null) ?? resolveParentMetadata(requestedNetwork, contractAddress)
            }
        >
            {children}
        </TokenMetadataContext>
    );
};
