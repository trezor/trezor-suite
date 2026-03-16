import {
    type CoinInfo,
    type Coins,
    type CryptoId,
    type Platforms,
    type PlatformsInfo,
} from 'invity-api';

import { parseCryptoId } from '../utils';

export const getTradingCoinInfoByCryptoId = (
    coins: Coins,
    cryptoId: CryptoId,
): CoinInfo | undefined => {
    if (coins[cryptoId]) {
        return coins[cryptoId];
    }

    const lowerCryptoId = cryptoId.toLowerCase();
    const matchingKey = Object.keys(coins).find(key => key.toLowerCase() === lowerCryptoId);

    return matchingKey ? coins[matchingKey] : undefined;
};

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
        coinSymbol: getTradingCoinInfoByCryptoId(coins ?? {}, cryptoId)?.symbol.toUpperCase(),
        contractAddress: parseCryptoId(cryptoId).contractAddress,
    };
};
