import { useContext } from 'react';
import { useSelector } from 'react-redux';

import { selectTokenByNetworkAndContract } from '@suite-common/token';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { TokenMetadataContext } from './TokenMetadataContext';

export const useTokenMetadata = (networkSymbol: NetworkSymbol, contractAddress: TokenAddress) => {
    const resolveSourceMetadata = useContext(TokenMetadataContext);
    const sourceMetadata = resolveSourceMetadata(networkSymbol, contractAddress);
    const accountToken = useSelector((state: AccountsRootState) =>
        sourceMetadata
            ? null
            : selectTokenByNetworkAndContract(state, networkSymbol, contractAddress),
    );

    return sourceMetadata ?? accountToken;
};
