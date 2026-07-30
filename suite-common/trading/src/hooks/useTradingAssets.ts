import { useCallback, useMemo } from 'react';

import {
    type CoinInfo,
    type Coins,
    type CryptoId,
    type Platforms,
    type PlatformsInfo,
} from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkModuleRepositoryDep } from '@suite-common/networks';
import {
    type Network,
    type NetworkSymbol,
    type NetworkSymbolNonTestnet,
    getDisplaySymbol,
    getMainnets,
    getNetwork,
    getNetworkDisplaySymbolName,
    isNetworkDisplaySymbol,
    isNetworkSymbol,
    isNetworkSymbolNonTestnet,
} from '@suite-common/wallet-config';
import { type TokenInfo } from '@trezor/connect';
import { isNotNull } from '@trezor/utils';

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

function getNonTestnetNetworkSymbol(network?: Network): NetworkSymbolNonTestnet | null {
    if (!network || !isNetworkSymbolNonTestnet(network.symbol)) return null;

    return network.symbol;
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

    if (isNativeToken && network) {
        const networkSymbol = getNonTestnetNetworkSymbol(network);

        if (
            !networkSymbol ||
            !network.coingeckoId ||
            !network.tradeCryptoId ||
            !isNetworkDisplaySymbol(network.displaySymbol)
        ) {
            return null;
        }

        return {
            isNativeToken: true,
            id: network.tradeCryptoId as CryptoId,
            name: network.name,
            coingeckoId: network.coingeckoId,
            symbol: networkSymbol,
            displaySymbol: network.displaySymbol,
            contractAddress: contractAddress as TradingAssetOptionNativeToken['contractAddress'],
            networkName: network.name,
            networkSymbol,
            displaySymbolName: getNetworkDisplaySymbolName(networkSymbol),
        } satisfies TradingAssetOptionNativeToken;
    }

    const networkSymbol = network ? network.symbol : platformInfo?.nativeCoinSymbol;

    // No supported network exists for this token's network symbol, filter it out
    if (!networkSymbol || !isNetworkSymbolNonTestnet(networkSymbol)) {
        return null;
    }

    const networkConfig = getNetwork(networkSymbol);
    if (!networkConfig.coingeckoId) return null;

    const coinInfoSymbol = coinInfo.symbol;

    return {
        isNativeToken: false,
        id: cryptoId,
        name: coinInfo.name,
        symbol: coinInfoSymbol,
        coingeckoId: networkConfig.coingeckoId,
        displaySymbol: getDisplaySymbol(coinInfoSymbol.toUpperCase(), contractAddress),
        contractAddress: contractAddress!,
        networkName: networkConfig.name,
        networkSymbol,
        displaySymbolName: coinInfo.name,
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
    networkSymbol: NetworkSymbolNonTestnet,
): TradingAssetOptionNativeToken {
    const network = getNetwork(networkSymbol);
    if (!network.coingeckoId) {
        throw new Error(`Trading network is missing coingeckoId: ${networkSymbol}`);
    }
    if (!isNetworkDisplaySymbol(network.displaySymbol)) {
        throw new Error(`Trading network has an invalid displaySymbol: ${networkSymbol}`);
    }

    return {
        isNativeToken: true,
        id: getCryptoId(networkSymbol),
        name: network.name,
        coingeckoId: network.coingeckoId,
        symbol: networkSymbol,
        displaySymbol: network.displaySymbol,
        contractAddress: null,
        networkName: network.name,
        networkSymbol,
        displaySymbolName: getNetworkDisplaySymbolName(networkSymbol),
    };
}

export function createAssetTokenOption<
    Token extends Pick<TokenInfo, 'contract' | 'symbol' | 'name'>,
>(networkSymbol: NetworkSymbolNonTestnet, token: Token): TradingAssetOptionWithContractAddress {
    const network = getNetwork(networkSymbol);
    if (!network.coingeckoId) {
        throw new Error(`Trading network is missing coingeckoId: ${networkSymbol}`);
    }

    return {
        id: getCryptoId(networkSymbol, token.contract),
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
    const { networkModuleRepository } = useServices(selectNetworkModuleRepositoryDep);
    const supportedAddressValidatorSymbols = useMemo(
        () => new Set(networkModuleRepository.getSupportedNetworks()),
        [networkModuleRepository],
    );

    const buildAssetOptions = useCallback(
        ({ includedCryptoIds = new Set() }: { includedCryptoIds?: Set<CryptoId> }) => {
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
        [getCoinsAndPlatforms, supportedAddressValidatorSymbols],
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

    const resolveAssetTokenOption = useCallback(
        (
            networkSymbol: NetworkSymbolNonTestnet,
            token: Pick<TokenInfo, 'contract' | 'symbol' | 'name'>,
        ): TradingAssetOptionWithContractAddress => {
            const { coins, platforms } = getCoinsAndPlatforms();
            const cryptoId = getCryptoId(networkSymbol, token.contract);

            if (coins?.[cryptoId]) {
                const result = createAssetOption({
                    cryptoId,
                    coinInfo: coins[cryptoId],
                    platformInfo: getTradingPlatformsInfoByCryptoId(platforms, cryptoId),
                });

                if (result !== null && !result.isNativeToken) {
                    return result;
                }
            }

            return createAssetTokenOption(networkSymbol, token);
        },
        [getCoinsAndPlatforms],
    );

    return { buildAssetOptions, createAssetOptionFromCryptoId, resolveAssetTokenOption };
}
