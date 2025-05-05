import { CoinInfo, Coins, CryptoId, Platforms, PlatformsInfo } from 'invity-api';

import { getDisplaySymbol } from '@suite-common/wallet-config';

import { TradingCryptoSelectItemProps } from '../types';
import { cryptoIdToNetwork, isCryptoIdForNativeToken, parseCryptoId } from '../utils';

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

export const toCryptoOption = (
    cryptoId: CryptoId,
    coinInfo: CoinInfo,
): TradingCryptoSelectItemProps => {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const isNativeToken = isCryptoIdForNativeToken(cryptoId);
    const coinInfoSymbol = coinInfo.symbol.toLowerCase();
    const symbol = isNativeToken
        ? (cryptoIdToNetwork(cryptoId)?.symbol ?? coinInfoSymbol)
        : coinInfoSymbol;
    const displaySymbol = getDisplaySymbol(coinInfoSymbol, contractAddress);

    return {
        type: 'currency',
        value: cryptoId,
        label: displaySymbol,
        cryptoName: coinInfo.name,
        coingeckoId: networkId,
        contractAddress: contractAddress || null,
        symbol,
    };
};
