import type { CryptoId } from 'invity-api';

import {
    cryptoIdToNetworkSymbolAndContractAddress,
    isCryptoIdForNativeToken,
    toTokenCryptoId,
} from '@suite-common/trading';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

export const toCaseAwareCryptoId = (cryptoId: CryptoId): CryptoId => {
    if (isCryptoIdForNativeToken(cryptoId)) {
        return cryptoId;
    }

    const { networkSymbol, contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(cryptoId);
    if (!contractAddress) {
        return cryptoId;
    }

    const adjustedContractAddress = getContractAddressForNetworkSymbol(
        networkSymbol,
        contractAddress,
    );

    return toTokenCryptoId(networkSymbol, adjustedContractAddress);
};
