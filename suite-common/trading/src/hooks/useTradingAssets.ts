import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type Coins, type CryptoId, type Platforms } from 'invity-api';

import { selectNetworkConfigs, selectSupportedNetworkSymbols } from '@suite-common/networks';
import {
    type Network,
    type NetworkConfigWithoutTestnets,
    type NetworkSymbol,
    asNetworkSymbol,
    getDisplaySymbol,
    getMainnets,
    getNetwork,
    getNetworkDisplaySymbolName,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { type TokenInfo } from '@trezor/connect';
import { isNotNull } from '@trezor/utils';

import { TRADING_DEFAULT_CRYPTO_CURRENCY } from '../constants';
import {
    type TradingAssetOption,
    type TradingAssetOptionNativeToken,
    type TradingAssetOptionWithContractAddress,
} from '../types';
import { cryptoIdToNetwork, getCryptoId, testnetToProdCryptoId } from '../utils';
import { useCoinsAndPlatforms } from './useCoinsAndPlatforms';
import { createAssetOption } from '../utils/createAssetOption';
import {
    getTradingNativeCoinSymbolByCryptoId,
    getTradingPlatformsInfoByCryptoId,
} from '../utils/infoUtils';

const mainnets = new Set(getMainnets().map(network => network.symbol));

function hasSupportedAddressValidator(
    platforms: Platforms,
    coins: Coins,
    cryptoId: CryptoId,
    supportedAddressValidatorSymbols: Set<NetworkSymbol>,
) {
    const prodCryptoId = testnetToProdCryptoId(cryptoId);
    const networkSymbol =
        cryptoIdToNetwork(prodCryptoId)?.symbol ??
        getTradingNativeCoinSymbolByCryptoId(platforms, coins, prodCryptoId);

    return (
        networkSymbol !== undefined &&
        isNetworkSymbol(networkSymbol) &&
        supportedAddressValidatorSymbols.has(networkSymbol)
    );
}

function getNonTestnetNetworkSymbol(
    network?: Network,
): NetworkConfigWithoutTestnets['symbol'] | null {
    return !network || network.testnet
        ? null
        : (network.symbol as NetworkConfigWithoutTestnets['symbol']);
}

function isAssetWithSupportedNetwork(
    platforms: Platforms,
    coins: Coins,
    cryptoId: CryptoId,
): boolean {
    const networkSymbol =
        cryptoIdToNetwork(cryptoId)?.symbol ??
        getTradingNativeCoinSymbolByCryptoId(platforms, coins, cryptoId);

    return Boolean(networkSymbol && isNetworkSymbol(networkSymbol) && mainnets.has(networkSymbol));
}

/**
 * @example
 * ```json
    {
        "id": "bitcoin",
        "coingeckoId": "bitcoin",
        "name": "Bitcoin",
        "networkId": "bitcoin",
        "networkName": "Bitcoin",
        "networkSymbol": "btc",
        "symbol": "btc",
        "displaySymbol": "BTC",
        "displaySymbolName": "Bitcoin",
        "contractAddress": null
    }
 * ```
 *
 * @example
 * ```json
    {
        "id": "optimistic-ethereum--0x0000000000000000000000000000000000000000",
        "coingeckoId": "ethereum",
        "name": "Ethereum",
        "networkId": "optimistic-ethereum",
        "networkName": "Optimism",
        "networkSymbol": "eth",
        "symbol": "op",
        "displaySymbol": "ETH",
        "displaySymbolName": "Ethereum",
        "contractAddress": "0x0000000000000000000000000000000000000000"
    }
 * ```
 *
 * @example
 * ```json
    {
        "id": "solana--EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "coingeckoId": "usd-coin",
        "name": "USDC",
        "networkId": "solana",
        "networkName": "Solana",
        "networkSymbol": "sol",
        "symbol": "usdc",
        "displaySymbol": "USDC",
        "displaySymbolName": "USDC",
        "contractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    }
 * ```
 */

export function createAssetNativeTokenOption(
    networkSymbol: NetworkConfigWithoutTestnets['symbol'],
): TradingAssetOptionNativeToken {
    const network = getNetwork(networkSymbol) as unknown as NetworkConfigWithoutTestnets;

    return {
        isNativeToken: true,
        id: getCryptoId(asNetworkSymbol(networkSymbol)),
        name: network.name,
        coingeckoId: network.coingeckoId,
        symbol: asNetworkSymbol(networkSymbol),
        displaySymbol: network.displaySymbol,
        contractAddress: null,
        networkName: network.name,
        networkSymbol: asNetworkSymbol(network.symbol),
        displaySymbolName: getNetworkDisplaySymbolName(asNetworkSymbol(network.symbol)),
    };
}

export function createAssetTokenOption<
    Token extends Pick<TokenInfo, 'contract' | 'symbol' | 'name'>,
>(networkSymbol: NetworkSymbol, token: Token): TradingAssetOptionWithContractAddress {
    const network = getNetwork(networkSymbol) as unknown as NetworkConfigWithoutTestnets;

    return {
        id: getCryptoId(asNetworkSymbol(networkSymbol), token.contract),
        coingeckoId: network.coingeckoId,

        isNativeToken: false,

        contractAddress: token.contract,
        symbol: token.symbol!,
        name: token.name!,
        displaySymbol: getDisplaySymbol(token.symbol!, token.contract),

        networkSymbol,
        networkName: network.name,
        displaySymbolName: token.name!,
    };
}

/**
 * Get flat array of all enabled, supported crypto currencies and their tokens sorted by market cap in descending order.
 */
export function useTradingAssets() {
    const getCoinsAndPlatforms = useCoinsAndPlatforms();
    const networkConfigs = useSelector(selectNetworkConfigs);
    const supportedNetworks = useSelector(selectSupportedNetworkSymbols);
    const supportedAddressValidatorSymbols = useMemo(
        () => new Set(supportedNetworks),
        [supportedNetworks],
    );
    type BuildAssetOptionsParams = { includedCryptoIds?: Set<CryptoId> };

    const buildAssetOptions = useCallback(
        ({ includedCryptoIds = new Set() }: BuildAssetOptionsParams) => {
            const { coins, platforms } = getCoinsAndPlatforms();

            const assets = Array.from(includedCryptoIds)
                .filter(
                    cryptoId =>
                        isAssetWithSupportedNetwork(platforms, coins, cryptoId) &&
                        hasSupportedAddressValidator(
                            platforms,
                            coins,
                            cryptoId,
                            supportedAddressValidatorSymbols,
                        ) &&
                        coins[cryptoId],
                )
                .map(cryptoId => [cryptoId, coins[cryptoId]] as const)
                .flatMap(([cryptoId, coinInfo]) => {
                    if (!coinInfo) return [];

                    return createAssetOption({
                        cryptoId,
                        coinInfo,
                        networkConfigs,
                        platformInfo: getTradingPlatformsInfoByCryptoId(platforms, cryptoId),
                    });
                })
                .filter(isNotNull);

            const networks = assets.filter(asset => asset.isNativeToken).map(asset => asset.symbol);

            return {
                /**
                 * Flat array of all enabled, supported crypto currencies and their tokens sorted by market cap in descending order.
                 */
                assets,

                /**
                 * Array of asset networks supported by Suite (not necessarily enabled)
                 */
                networks,
            };
        },
        [getCoinsAndPlatforms, networkConfigs, supportedAddressValidatorSymbols],
    );

    const createAssetOptionFromCryptoId = useCallback<(cryptoId?: CryptoId) => TradingAssetOption>(
        cryptoId => {
            const { coins, platforms } = getCoinsAndPlatforms();

            const network = cryptoIdToNetwork(cryptoId);
            const resolvedNetworkSymbol =
                getNonTestnetNetworkSymbol(network) ?? TRADING_DEFAULT_CRYPTO_CURRENCY;
            const defaultAssetOption = createAssetNativeTokenOption(resolvedNetworkSymbol);

            if (cryptoId && coins[cryptoId]) {
                return (
                    createAssetOption({
                        cryptoId,
                        coinInfo: coins[cryptoId],
                        networkConfigs,
                        platformInfo: getTradingPlatformsInfoByCryptoId(platforms, cryptoId),
                    }) ?? defaultAssetOption
                );
            }

            return defaultAssetOption;
        },
        [getCoinsAndPlatforms, networkConfigs],
    );

    const resolveAssetTokenOption = useCallback(
        (
            networkSymbol: NetworkSymbol,
            token: Pick<TokenInfo, 'contract' | 'symbol' | 'name'>,
        ): TradingAssetOptionWithContractAddress => {
            const { coins, platforms } = getCoinsAndPlatforms();
            const cryptoId = getCryptoId(networkSymbol, token.contract);

            if (coins?.[cryptoId]) {
                const result = createAssetOption({
                    cryptoId,
                    coinInfo: coins[cryptoId],
                    networkConfigs,
                    platformInfo: getTradingPlatformsInfoByCryptoId(platforms, cryptoId),
                });

                if (result !== null && !result.isNativeToken) {
                    return result;
                }
            }

            return createAssetTokenOption(networkSymbol, token);
        },
        [getCoinsAndPlatforms, networkConfigs],
    );

    return { buildAssetOptions, createAssetOptionFromCryptoId, resolveAssetTokenOption };
}
