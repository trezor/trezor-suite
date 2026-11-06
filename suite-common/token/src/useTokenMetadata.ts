import { useContext } from 'react';
import { useSelector } from 'react-redux';

import { type TokenAddress } from '@suite-common/tokens';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { TokenMetadataContext } from './TokenMetadataContext';
import { selectTokenByNetworkAndContract } from './tokenMetadataSelectors';

/** Native-coin inputs have no contract and therefore no token metadata. */
export const useTokenMetadata = (
    networkSymbol: NetworkSymbol,
    contractAddress: TokenAddress | undefined,
) => {
    const { tokensByNetwork } = useContext(TokenMetadataContext);
    const sourceMetadata = contractAddress
        ? tokensByNetwork.get(networkSymbol)?.get(contractAddress)
        : undefined;
    const accountToken = useSelector((state: AccountsRootState) =>
        sourceMetadata || !contractAddress
            ? null
            : selectTokenByNetworkAndContract(state, networkSymbol, contractAddress),
    );

    return sourceMetadata ?? accountToken;
};
