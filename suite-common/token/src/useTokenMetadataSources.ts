import { useContext } from 'react';

import { TokenMetadataContext } from './TokenMetadataContext';

/** Captures the owning metadata collections so a portal can provide them to its content. */
export const useTokenMetadataSources = () => useContext(TokenMetadataContext).sources;
