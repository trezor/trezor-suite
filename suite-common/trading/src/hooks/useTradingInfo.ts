import { useCallback, useMemo } from 'react';

import { CryptoId } from 'invity-api';

import { getNetwork, getNetworkByTradeCryptoId } from '@suite-common/wallet-config';
import addressValidator from '@trezor/address-validator';

import { selectTradingInfo, selectTradingInfoLegacy } from '../selectors/tradingSelectors';
import {
    TradingCryptoSelectItemProps,
    TradingCryptoSelectOptionProps,
    TradingInfoProps,
    TradingType,
} from '../types';
import {
    cryptoIdToNetwork,
    isCryptoIdForNativeToken,
    parseCryptoId,
    testnetToProdCryptoId,
} from '../utils';
import { useSelector } from './useSelector';
import {
    getTradingCoinInfoByCryptoId,
    getTradingCoinSymbolByCryptoId,
    getTradingNativeCoinSymbolByCryptoId,
    getTradingPlatformsInfoByCryptoId,
    getTradingSymbolAndContractAddressByCryptoId,
    toCryptoOption,
} from '../utils/infoUtils';

const supportedAddressValidatorSymbols = new Set(
    addressValidator.getCurrencies().map(c => c.symbol),
);

const sortPopularCurrencies = (
    a: TradingCryptoSelectItemProps,
    b: TradingCryptoSelectItemProps,
) => {
    if (a.coingeckoId && b.coingeckoId) {
        const order = ['bitcoin', 'ethereum', 'litecoin', 'cardano', 'solana'];

        const indexA = order.indexOf(a.coingeckoId);
        const indexB = order.indexOf(b.coingeckoId);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
    }

    return 0;
};

/**
 * TODO: trading - delete section after migration
 *
 * @param section used only for purpose in refactored desktop trading
 */
export const useTradingInfo = (section?: TradingType): TradingInfoProps => {
    const tradingInfo = useSelector(selectTradingInfoLegacy);
    const tradingNewInfo = useSelector(selectTradingInfo);

    const getInfo = () => {
        if (section) {
            // TODO: trading - refactor only buy is refactored for now
            return section === 'buy' ? tradingNewInfo : tradingInfo;
        }

        return tradingInfo;
    };
    const info = getInfo();

    const { platforms, coins } = useMemo(
        () => ({
            platforms: info?.platforms ?? {},
            coins: info?.coins ?? {},
        }),
        [info],
    );

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
        [platforms, coins],
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

    const buildCryptoOptions = useCallback(
        (
            cryptoIds: Set<CryptoId>,
            excludedCryptoIds?: Set<CryptoId>,
        ): TradingCryptoSelectOptionProps[] => {
            const popularCurrencies: TradingCryptoSelectItemProps[] = [];
            const otherCurrencies: TradingCryptoSelectItemProps[] = [];
            const tokenGroups: TradingCryptoSelectOptionProps[][] = [];

            cryptoIds.forEach(cryptoId => {
                const coinInfo = coins[cryptoId];

                if (!coinInfo) {
                    return;
                }

                if (excludedCryptoIds?.has(cryptoId)) {
                    return;
                }

                const nativeCoinSymbol =
                    cryptoIdToNetwork(testnetToProdCryptoId(cryptoId))?.symbol ??
                    cryptoIdToNativeCoinSymbol(testnetToProdCryptoId(cryptoId));
                if (!nativeCoinSymbol || !supportedAddressValidatorSymbols.has(nativeCoinSymbol)) {
                    return;
                }

                const { networkId, contractAddress } = parseCryptoId(cryptoId);
                const networkName = cryptoIdToPlatformName(networkId) ?? networkId;
                const option = toCryptoOption(cryptoId, coinInfo);

                if (getNetworkByTradeCryptoId(cryptoId)) {
                    const isNativeToken = isCryptoIdForNativeToken(cryptoId);
                    const optionWithNetworkName = isNativeToken
                        ? { ...option, networkName }
                        : option;

                    popularCurrencies.push(optionWithNetworkName);
                } else if (!contractAddress) {
                    otherCurrencies.push(option);
                } else {
                    const tokenGroup = tokenGroups.find(group =>
                        group.find(item => item.networkName === networkName),
                    );
                    const optionWithNetwork = {
                        ...option,
                        networkName,
                        coingeckoId: networkId,
                        contractAddress,
                    };

                    if (!tokenGroup) {
                        tokenGroups.push([
                            {
                                type: 'group',
                                label: 'TR_TRADING_NETWORK_TOKENS',
                                coingeckoId: networkId,
                                networkName,
                            },
                            {
                                ...optionWithNetwork,
                            },
                        ]);
                    } else {
                        tokenGroup.push(optionWithNetwork);
                    }
                }
            });

            popularCurrencies.sort(sortPopularCurrencies);

            return [
                { type: 'group', label: 'TR_TRADING_POPULAR_CURRENCIES' },
                ...popularCurrencies,
                { type: 'group', label: 'TR_TRADING_OTHER_CURRENCIES' },
                ...otherCurrencies,

                ...tokenGroups.flat(),
            ];
        },
        [coins, cryptoIdToPlatformName, cryptoIdToNativeCoinSymbol],
    );

    const buildDefaultCryptoOption = useCallback(
        (cryptoId: CryptoId | undefined) => {
            const coinInfo = cryptoId && coins[cryptoId];
            if (coinInfo) {
                return toCryptoOption(cryptoId, coinInfo);
            }

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
        },
        [coins],
    );

    return {
        cryptoIdToPlatformName,
        cryptoIdToCoinName,
        cryptoIdToCoinSymbol,
        cryptoIdToNativeCoinSymbol,
        cryptoIdToSymbolAndContractAddress,
        buildCryptoOptions,
        buildDefaultCryptoOption,
    };
};
