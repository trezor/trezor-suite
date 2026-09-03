import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { type Coins, type CryptoId, type Platforms } from 'invity-api';

import { selectTradingInfo } from '../selectors/tradingSelectors';
import {
    getTradingCoinInfoByCryptoId,
    getTradingCoinSymbolByCryptoId,
    getTradingNativeCoinSymbolByCryptoId,
    getTradingPlatformsInfoByCryptoId,
    getTradingSymbolAndContractAddressByCryptoId,
} from '../utils/infoUtils';

const emptyCoins: Coins = {};
const emptyPlatforms: Platforms = {};

export function useTradingUtils() {
    const { coins = emptyCoins, platforms = emptyPlatforms } = useSelector(selectTradingInfo);

    const cryptoIdToPlatformName = useCallback(
        (cryptoId: CryptoId) => getTradingPlatformsInfoByCryptoId(platforms, cryptoId)?.name,
        [platforms],
    );

    const cryptoIdToCoinName = useCallback(
        (cryptoId: CryptoId) => getTradingCoinInfoByCryptoId(coins, cryptoId)?.name,
        [coins],
    );

    const cryptoIdToNativeCoinSymbol = useCallback(
        (cryptoId: CryptoId) => getTradingNativeCoinSymbolByCryptoId(platforms, coins, cryptoId),
        [coins, platforms],
    );

    const cryptoIdToCoinSymbol = useCallback(
        (cryptoId: CryptoId) => getTradingCoinSymbolByCryptoId(coins, cryptoId),
        [coins],
    );

    const cryptoIdToSymbolAndContractAddress = useCallback(
        (cryptoId: CryptoId | undefined) =>
            getTradingSymbolAndContractAddressByCryptoId(coins, cryptoId),
        [coins],
    );

    return {
        cryptoIdToPlatformName,
        cryptoIdToCoinName,
        cryptoIdToNativeCoinSymbol,
        cryptoIdToCoinSymbol,
        cryptoIdToSymbolAndContractAddress,
    } as const;
}
