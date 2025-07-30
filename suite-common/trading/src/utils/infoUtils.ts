import { CoinInfo, Coins, CryptoId, Platforms, PlatformsInfo } from 'invity-api';

import { getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';

import { TradingCryptoSelectItemProps } from '../types';
import { cryptoIdToNetwork, isCryptoIdForNativeToken, parseCryptoId } from '../utils';

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
        coinSymbol: getTradingCoinInfoByCryptoId(coins ?? {}, cryptoId)?.symbol,
        contractAddress: parseCryptoId(cryptoId).contractAddress,
    };
};

export const toCryptoOption = (
    cryptoId?: CryptoId | null,
    coinInfo?: CoinInfo | null,
): TradingCryptoSelectItemProps => {
    if (!cryptoId || !coinInfo) {
        const { coingeckoId, name, symbol } = getNetwork('btc');
        const item: TradingCryptoSelectItemProps = {
            type: 'currency',
            value: coingeckoId as CryptoId,
            label: symbol.toUpperCase(),
            symbol,
            cryptoName: name,
            coingeckoId,
            contractAddress: null,
        };

        return item;
    }
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
