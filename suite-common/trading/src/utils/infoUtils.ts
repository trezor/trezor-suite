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
): string | undefined => {
    // `CoinInfo.symbol` is a required `string` in the invity-api types, but `coins` comes verbatim
    // from an untrusted/user-selectable trade server (`tradeApi.getInfo()` returns the response
    // unvalidated) — a coin entry with a missing/non-string `symbol` would otherwise throw on
    // `.toUpperCase()`. The `?.` only guards against a missing `CoinInfo`, not a poison `symbol`,
    // and these getters run inside memoized selectors consumed by `useSelector` during render, so a
    // throw here crashes the React tree. Fall back to `undefined` (callers already handle it).
    const symbol = getTradingCoinInfoByCryptoId(coins, cryptoId)?.symbol;

    return typeof symbol === 'string' ? symbol.toUpperCase() : undefined;
};

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
        // See `getTradingCoinSymbolByCryptoId`: `symbol` may be poison from an untrusted trade
        // server, so guard it before `.toUpperCase()` to avoid a render-time crash.
        coinSymbol: getTradingCoinSymbolByCryptoId(coins ?? {}, cryptoId),
        contractAddress: parseCryptoId(cryptoId).contractAddress,
    };
};
