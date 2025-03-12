import { CoinInfo, Coins, CryptoId, Platforms, PlatformsInfo } from 'invity-api';

import { parseCryptoId } from '../utils';

export const getTradingCoinInfoByCryptoId = (
    coins: Coins,
    cryptoId: CryptoId,
): CoinInfo | undefined => coins[cryptoId];

export const getTradingCoinSymbolByCryptoId = (
    coins: Coins,
    cryptoId: CryptoId,
): string | undefined => getTradingCoinInfoByCryptoId(coins, cryptoId)?.symbol.toUpperCase();

export const getTradingPlatformsInfoByCryptoId = (
    platforms: Platforms,
    cryptoId: CryptoId,
): PlatformsInfo | undefined => platforms[cryptoId];

export const getTradingNativeCoinSymbolByCryptoId = (
    platforms: Platforms,
    coins: Coins,
    cryptoId: CryptoId,
): string | undefined => {
    const { networkId } = parseCryptoId(cryptoId);

    return (
        getTradingPlatformsInfoByCryptoId(platforms, networkId)?.nativeCoinSymbol ??
        getTradingCoinInfoByCryptoId(coins, networkId)?.symbol
    );
};

export const getTradingSymbolAndContractAddressByCryptoId = (
    coins: Coins | undefined,
    cryptoId: CryptoId | undefined,
): { coinSymbol: string | undefined; contractAddress: string | undefined } => {
    if (!cryptoId) {
        return { coinSymbol: undefined, contractAddress: undefined };
    }

    return {
        coinSymbol: getTradingCoinInfoByCryptoId(coins ?? {}, cryptoId)?.symbol,
        contractAddress: parseCryptoId(cryptoId).contractAddress,
    };
};
