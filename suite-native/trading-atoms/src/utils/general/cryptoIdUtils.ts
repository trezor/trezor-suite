import { type NetworkConfigDeps } from '@suite-common/networks';
import type { CryptoId } from 'invity-api';

import {
    cryptoIdToNetworkSymbolAndContractAddress,
    isCryptoIdForNativeToken,
    toTokenCryptoId,
} from '@suite-common/trading';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

export const toCaseAwareCryptoId = (
    networkConfigDeps: NetworkConfigDeps,
    cryptoId: CryptoId,
): CryptoId => {
    if (isCryptoIdForNativeToken(cryptoId)) {
        return cryptoId;
    }

    const { symbol, contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(
        networkConfigDeps,
        cryptoId,
    );
    if (!contractAddress) {
        return cryptoId;
    }

    const adjustedContractAddress = getContractAddressForNetworkSymbol(
        networkConfigDeps,
        symbol,
        contractAddress,
    );

    return toTokenCryptoId(networkConfigDeps, symbol, adjustedContractAddress);
};
