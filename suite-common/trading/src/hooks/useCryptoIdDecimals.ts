import { type CryptoId } from 'invity-api';

import { getNetwork } from '@suite-common/wallet-config';
import { useTokenDecimals } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

import { cryptoIdToNetworkSymbolAndContractAddress } from '../utils';

// Resolves decimals for any cryptoId: native coins from the network config,
// tokens from redux (held or cached), fetching from connect when missing.
export const useCryptoIdDecimals = (
    cryptoId?: CryptoId,
    accountKey?: AccountKey,
): number | undefined => {
    const { symbol, contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(cryptoId);

    const { decimals: tokenDecimals } = useTokenDecimals(symbol, contractAddress, accountKey);

    if (!symbol) {
        return undefined;
    }

    return contractAddress ? tokenDecimals : getNetwork(symbol).decimals;
};
