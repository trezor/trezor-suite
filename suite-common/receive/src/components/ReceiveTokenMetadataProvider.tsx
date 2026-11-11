import { type ReactNode } from 'react';

import { TokenMetadataProvider } from '@suite-common/token';

import { rankedTokenDefinitionsToTokenMetadataSources } from '../globalReceiveAssetUtils';
import { useRankedTokenDefinitions } from '../hooks/useRankedTokenDefinitions';

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
