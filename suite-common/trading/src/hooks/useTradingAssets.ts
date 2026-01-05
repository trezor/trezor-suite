import { useCallback } from 'react';

import { CoinInfo, Coins, CryptoId, Platforms, PlatformsInfo } from 'invity-api';

import {
    NetworkConfigWithoutTestnets,
    getDisplaySymbol,
    getMainnets,
    getNetwork,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { getCurrencies } from '@trezor/address-validator';

import {
    cryptoIdToNetwork,
    isCryptoIdForNativeToken,
    parseCryptoId,
    testnetToProdCryptoId,
} from '../utils';
import { useCoinsAndPlatforms } from './useCoinsAndPlatforms';
import { TRADING_DEFAULT_CRYPTO_CURRENCY } from '../constants';
import {
    getTradingNativeCoinSymbolByCryptoId,
    getTradingPlatformsInfoByCryptoId,
} from '../utils/infoUtils';

const supportedAddressValidatorSymbols = new Set(getCurrencies().map(c => c.symbol));
const mainnets = new Set(getMainnets().map(network => network.symbol));

function hasSupportedAddressValidator(platforms: Platforms, coins: Coins, cryptoId: CryptoId) {
    const prodCryptoId = testnetToProdCryptoId(cryptoId);
    const networkSymbol =
        cryptoIdToNetwork(prodCryptoId)?.symbol ??
        getTradingNativeCoinSymbolByCryptoId(platforms, coins, prodCryptoId);

    return networkSymbol && supportedAddressValidatorSymbols.has(networkSymbol);
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

interface CreateAssetOptionProps {
    cryptoId: CryptoId;
    coinInfo: CoinInfo;
    platformInfo?: PlatformsInfo;
}

export function createAssetOption({ cryptoId, coinInfo, platformInfo }: CreateAssetOptionProps) {
    const { networkId, contractAddress = null } = parseCryptoId(cryptoId);
    let network = cryptoIdToNetwork(cryptoId);
    const isNativeToken = Boolean(
        network && (!contractAddress || isCryptoIdForNativeToken(cryptoId)),
    );

    // Unsupported network
    if (!network && isNativeToken) {
        return null;
    }

    if (isNativeToken) {
        const networkConfig = network as NetworkConfigWithoutTestnets;

        return {
            isNativeToken,
            id: networkConfig.tradeCryptoId as CryptoId,
            name: networkConfig.name,
            coingeckoId: networkConfig.coingeckoId!,
            symbol: networkConfig.symbol,
            displaySymbol: networkConfig.displaySymbol,
            contractAddress,
            networkName: networkConfig.name,
            networkSymbol: networkConfig.symbol,
        } as const;
    }

    const networkSymbol = network ? network.symbol : platformInfo?.nativeCoinSymbol;

    // No supported network exists for this token's network symbol, filter it out
    if (!networkSymbol || !isNetworkSymbol(networkSymbol)) {
        return null;
    }

    network = getNetwork(networkSymbol)!;

    const coinInfoSymbol = coinInfo.symbol.toLowerCase();

    return {
        isNativeToken,
        id: cryptoId,
        name: coinInfo.name,
        symbol: coinInfoSymbol,
        coingeckoId: networkId as string,
        displaySymbol: getDisplaySymbol(coinInfoSymbol, contractAddress),
        contractAddress,
        networkName: network.name,
        networkSymbol: network.symbol,
    } as const;
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
        "contractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    }
 * ```
 */
export type TradingAssetOption = NonNullable<ReturnType<typeof createAssetOption>>;

export function createDefaultAssetOption(
    networkSymbol: NetworkConfigWithoutTestnets['symbol'],
): TradingAssetOption {
    const network = getNetwork(networkSymbol) as NetworkConfigWithoutTestnets;

    return {
        isNativeToken: true,
        id: network.tradeCryptoId as CryptoId,
        name: network.name,
        coingeckoId: network.coingeckoId,
        symbol: networkSymbol,
        displaySymbol: network.displaySymbol,
        contractAddress: null,
        networkName: network.name,
        networkSymbol: network.symbol,
    } as const;
}

/**
 * Get flat array of all enabled, supported crypto currencies and their tokens sorted by market cap in descending order.
 */
export function useTradingAssets() {
    const getCoinsAndPlatforms = useCoinsAndPlatforms();

    const buildAssetOptions = useCallback(
        ({
            enabledCryptoIds = new Set(),
            disabledCryptoIds = new Set(),
        }: {
            enabledCryptoIds?: Set<CryptoId>;
            disabledCryptoIds?: Set<CryptoId>;
        }) => {
            const { coins, platforms } = getCoinsAndPlatforms();

            const assets = Array.from(enabledCryptoIds)
                .filter(
                    cryptoId =>
                        !disabledCryptoIds.has(cryptoId) &&
                        isAssetWithSupportedNetwork(platforms, coins, cryptoId) &&
                        hasSupportedAddressValidator(platforms, coins, cryptoId) &&
                        coins[cryptoId],
                )
                .map(cryptoId => [cryptoId, coins[cryptoId]] as const)
                .map(([cryptoId, coinInfo]) =>
                    createAssetOption({
                        cryptoId,
                        coinInfo,
                        platformInfo: getTradingPlatformsInfoByCryptoId(platforms, cryptoId),
                    }),
                )
                .filter(asset => asset !== null);

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
        [getCoinsAndPlatforms],
    );

    const createAssetOptionFromCryptoId = useCallback<
        (
            cryptoId?: CryptoId,
            defaultNetworkSymbol?: NetworkConfigWithoutTestnets['symbol'],
        ) => TradingAssetOption
    >(
        (cryptoId, defaultNetworkSymbol = TRADING_DEFAULT_CRYPTO_CURRENCY) => {
            const { coins, platforms } = getCoinsAndPlatforms();
            const defaultAssetOption = createDefaultAssetOption(defaultNetworkSymbol);

            if (cryptoId && coins[cryptoId]) {
                return (
                    createAssetOption({
                        cryptoId,
                        coinInfo: coins[cryptoId],
                        platformInfo: getTradingPlatformsInfoByCryptoId(platforms, cryptoId),
                    }) ?? defaultAssetOption
                );
            }

            return defaultAssetOption;
        },
        [getCoinsAndPlatforms],
    );

    return { buildAssetOptions, createAssetOptionFromCryptoId };
}

export type UseTradingAssets = ReturnType<typeof useTradingAssets>;
