import { useContext } from 'react';
import { useSelector } from 'react-redux';

import { selectTokenByNetworkAndContract } from '@suite-common/token';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { TokenMetadataContext } from './TokenMetadataContext';

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
