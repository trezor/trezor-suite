import { useCallback } from 'react';

import { type CryptoId } from 'invity-api';

import { useCoinsAndPlatforms } from './useCoinsAndPlatforms';
import {
    getTradingCoinInfoByCryptoId,
    getTradingCoinSymbolByCryptoId,
    getTradingNativeCoinSymbolByCryptoId,
    getTradingPlatformsInfoByCryptoId,
    getTradingSymbolAndContractAddressByCryptoId,
} from '../utils/infoUtils';

export function useTradingUtils() {
    const getCoinsAndPlatforms = useCoinsAndPlatforms();

    const cryptoIdToPlatformName = useCallback(
        (cryptoId: CryptoId) =>
            getTradingPlatformsInfoByCryptoId(getCoinsAndPlatforms().platforms, cryptoId)?.name,
        [getCoinsAndPlatforms],
    );

    const cryptoIdToCoinName = useCallback(
        (cryptoId: CryptoId) =>
            getTradingCoinInfoByCryptoId(getCoinsAndPlatforms().coins, cryptoId)?.name,
        [getCoinsAndPlatforms],
    );

    const cryptoIdToNativeCoinSymbol = useCallback(
        (cryptoId: CryptoId) => {
            const { platforms, coins } = getCoinsAndPlatforms();

            return getTradingNativeCoinSymbolByCryptoId(platforms, coins, cryptoId);
        },
        [getCoinsAndPlatforms],
    );

    const cryptoIdToCoinSymbol = useCallback(
        (cryptoId: CryptoId) =>
            getTradingCoinSymbolByCryptoId(getCoinsAndPlatforms().coins, cryptoId),
        [getCoinsAndPlatforms],
    );

    const cryptoIdToSymbolAndContractAddress = useCallback(
        (cryptoId: CryptoId | undefined) =>
            getTradingSymbolAndContractAddressByCryptoId(getCoinsAndPlatforms().coins, cryptoId),
        [getCoinsAndPlatforms],
    );

    return {
        cryptoIdToPlatformName,
        cryptoIdToCoinName,
        cryptoIdToNativeCoinSymbol,
        cryptoIdToCoinSymbol,
        cryptoIdToSymbolAndContractAddress,
    } as const;
}
