import { useContext } from 'react';

import { TokenMetadataContext } from './TokenMetadataContext';

export const useTokenMetadataByNetwork = () => useContext(TokenMetadataContext).tokensByNetwork;
