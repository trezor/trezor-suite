import { useContext } from 'react';
import { useSelector } from 'react-redux';

import { type TokenAddress, normalizeTokenAddress } from '@suite-common/tokens';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { type TokenMetadata, TokenMetadataContext } from './TokenMetadataContext';
import { selectTokenByNetworkAndContract } from './tokenMetadataSelectors';

/**
 * The accounts store takes precedence; context metadata (the trading catalog, or data fetched
 * outside the store) fills in tokens the accounts do not hold and fields their entries lack.
 * Native-coin inputs have no contract and therefore no token metadata.
 */
export const useTokenMetadata = (
    networkSymbol: NetworkSymbol | undefined,
    contractAddress: TokenAddress | undefined,
): TokenMetadata | null => {
    const { tokensByNetwork } = useContext(TokenMetadataContext);
    const contractKey = contractAddress ? normalizeTokenAddress(contractAddress) : undefined;
    const accountToken = useSelector((state: AccountsRootState) =>
        networkSymbol && contractAddress
            ? selectTokenByNetworkAndContract(state, networkSymbol, contractAddress)
            : null,
    );
    const contextToken =
        networkSymbol && contractKey
            ? tokensByNetwork.get(networkSymbol)?.get(contractKey)
            : undefined;

    if (!accountToken || !contextToken) {
        return accountToken ?? contextToken ?? null;
    }

    // An empty name or symbol counts as missing, as in the components that render them.
    return {
        contract: accountToken.contract,
        name: accountToken.name || contextToken.name,
        symbol: accountToken.symbol || contextToken.symbol,
        decimals: accountToken.decimals ?? contextToken.decimals,
        standard: accountToken.standard ?? contextToken.standard,
        ...(contextToken.isRecognized && { isRecognized: true }),
    };
};
