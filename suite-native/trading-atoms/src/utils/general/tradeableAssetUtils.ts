import type { CoinInfo, CryptoId } from 'invity-api';

import { cryptoIdToSymbol, isCryptoIdForNativeToken, parseCryptoId } from '@suite-common/trading';
import { type NetworkSymbolExtended, getDisplaySymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { type TradeableAsset } from '@suite-native/trading-types';

export const coinInfoToTradeableAsset = (
    cryptoId: CryptoId,
    coinInfo: CoinInfo,
): TradeableAsset => {
    const { services, symbol, ...info } = coinInfo;
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const isEthNativeCoin = symbol === 'eth' && isCryptoIdForNativeToken(cryptoId);

    const tokenContractAddress = isEthNativeCoin ? undefined : (contractAddress as TokenAddress);

    return {
        cryptoId,
        symbol: getDisplaySymbol(
            symbol.toUpperCase(),
            tokenContractAddress,
        ) as NetworkSymbolExtended,
        contractAddress: tokenContractAddress,
        networkId,
        ...info,
    };
};

export const getSymbolFromTradeableAsset = (asset: TradeableAsset | undefined) =>
    asset?.cryptoId ? cryptoIdToSymbol(asset.cryptoId) : undefined;
