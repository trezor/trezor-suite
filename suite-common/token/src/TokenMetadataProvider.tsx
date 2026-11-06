import { type ReactNode, useContext } from 'react';

import { TokenMetadataContext, type TokenMetadataSource } from './TokenMetadataContext';
import { consolidateTokenMetadata } from './consolidateTokenMetadata';

type TokenMetadataProviderProps = {
    sources: readonly TokenMetadataSource[];
    children: ReactNode;
};

/** Supplies complete source collections before token data enters presentation components. */
export const TokenMetadataProvider = ({ sources, children }: TokenMetadataProviderProps) => {
    const parent = useContext(TokenMetadataContext);
    const tokensByNetwork = consolidateTokenMetadata({
        sources,
        parentTokensByNetwork: parent.tokensByNetwork,
    });

    return <TokenMetadataContext value={{ tokensByNetwork }}>{children}</TokenMetadataContext>;
};
