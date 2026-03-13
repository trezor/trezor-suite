import { useCallback } from 'react';

import {
    type CoinInfo,
    type Coins,
    type CryptoId,
    type Platforms,
    type PlatformsInfo,
} from 'invity-api';

import {
    type Network,
    type NetworkConfigWithoutTestnets,
    type NetworkSymbol,
    getDisplaySymbol,
    getMainnets,
    getNetwork,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import addressValidator from '@trezor/address-validator';
import { type TokenInfo } from '@trezor/connect';

import { TRADING_DEFAULT_CRYPTO_CURRENCY } from '../constants';
import {
    type TradingAssetOption,
    type TradingAssetOptionNativeToken,
    type TradingAssetOptionWithContractAddress,
} from '../types';
import {
    cryptoIdToNetwork,
    getCryptoId,
    isCryptoIdForNativeToken,
    parseCryptoId,
    testnetToProdCryptoId,
} from '../utils';
import { useCoinsAndPlatforms } from './useCoinsAndPlatforms';
import {
    getTradingNativeCoinSymbolByCryptoId,
    getTradingPlatformsInfoByCryptoId,
} from '../utils/infoUtils';

const supportedAddressValidatorSymbols = new Set(
    addressValidator.getCurrencies().map(c => c.symbol),
);
const mainnets = new Set(getMainnets().map(network => network.symbol));

function hasSupportedAddressValidator(platforms: Platforms, coins: Coins, cryptoId: CryptoId) {
    const prodCryptoId = testnetToProdCryptoId(cryptoId);
    const networkSymbol =
        cryptoIdToNetwork(prodCryptoId)?.symbol ??
        getTradingNativeCoinSymbolByCryptoId(platforms, coins, prodCryptoId);

    return networkSymbol && supportedAddressValidatorSymbols.has(networkSymbol);
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

interface CreateAssetOptionProps {
    cryptoId: CryptoId;
    coinInfo: CoinInfo;
    platformInfo?: PlatformsInfo;
}

export function createAssetOption({
    cryptoId,
    coinInfo,
    platformInfo,
}: CreateAssetOptionProps): TradingAssetOption | null {
    const { contractAddress = null } = parseCryptoId(cryptoId);
    const network = cryptoIdToNetwork(cryptoId);
    const isNativeToken = Boolean(
        network && (!contractAddress || isCryptoIdForNativeToken(cryptoId)),
    );

    if (isNativeToken) {
        const networkConfig = network as NetworkConfigWithoutTestnets;

        return {
            isNativeToken: true,
            id: networkConfig.tradeCryptoId as CryptoId,
            name: networkConfig.name,
            coingeckoId: networkConfig.coingeckoId!,
            symbol: networkConfig.symbol,
            displaySymbol: networkConfig.displaySymbol,
            contractAddress: contractAddress as TradingAssetOptionNativeToken['contractAddress'],
            networkName: networkConfig.name,
            networkSymbol: networkConfig.symbol,
        } satisfies TradingAssetOptionNativeToken;
    }

    const networkSymbol = network ? network.symbol : platformInfo?.nativeCoinSymbol;

    // No supported network exists for this token's network symbol, filter it out
    if (!networkSymbol || !isNetworkSymbol(networkSymbol)) {
        return null;
    }

    const networkConfig = getNetwork(networkSymbol)! as NetworkConfigWithoutTestnets;

    const coinInfoSymbol = coinInfo.symbol;

    return {
        isNativeToken: false,
        id: cryptoId,
        name: coinInfo.name,
        symbol: coinInfoSymbol,
        coingeckoId: networkConfig.coingeckoId!,
        displaySymbol: getDisplaySymbol(coinInfoSymbol.toUpperCase(), contractAddress),
        contractAddress: contractAddress!,
        networkName: networkConfig.name,
        networkSymbol: networkConfig.symbol,
    } satisfies TradingAssetOptionWithContractAddress;
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

export function createAssetNativeTokenOption(
    networkSymbol: NetworkConfigWithoutTestnets['symbol'],
): TradingAssetOptionNativeToken {
    const network = getNetwork(networkSymbol) as NetworkConfigWithoutTestnets;

    return {
        isNativeToken: true,
        id: getCryptoId(networkSymbol),
        name: network.name,
        coingeckoId: network.coingeckoId,
        symbol: networkSymbol,
        displaySymbol: network.displaySymbol,
        contractAddress: null,
        networkName: network.name,
        networkSymbol: network.symbol,
    };
}

export function createAssetTokenOption<
    Token extends Pick<TokenInfo, 'contract' | 'symbol' | 'name'>,
>(networkSymbol: NetworkSymbol, token: Token): TradingAssetOptionWithContractAddress {
    const network = getNetwork(networkSymbol) as NetworkConfigWithoutTestnets;

    return {
        id: getCryptoId(networkSymbol, token.contract),
        coingeckoId: network.coingeckoId!,

        isNativeToken: false,

        contractAddress: token.contract,
        symbol: token.symbol!,
        name: token.name!,
        displaySymbol: getDisplaySymbol(token.symbol!, token.contract),

        networkSymbol,
        networkName: network.name,
    };
}

/**
 * Get flat array of all enabled, supported crypto currencies and their tokens sorted by market cap in descending order.
 */
export function useTradingAssets() {
    const getCoinsAndPlatforms = useCoinsAndPlatforms();

    const buildAssetOptions = useCallback(
        ({ includedCryptoIds = new Set() }: { includedCryptoIds?: Set<CryptoId> }) => {
            const { coins, platforms } = getCoinsAndPlatforms();

            const assets = Array.from(includedCryptoIds)
                .filter(
                    cryptoId =>
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
