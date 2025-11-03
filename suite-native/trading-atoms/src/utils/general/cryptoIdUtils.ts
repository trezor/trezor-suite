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

    const { symbol, contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(cryptoId);
    if (!contractAddress) {
        return cryptoId;
    }

    const adjustedContractAddress = getContractAddressForNetworkSymbol(symbol, contractAddress);

    return toTokenCryptoId(symbol, adjustedContractAddress);
};
