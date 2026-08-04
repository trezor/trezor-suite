import { useCallback, useMemo } from 'react';

import {
    type CoinInfo,
    type Coins,
    type CryptoId,
    type Platforms,
    type PlatformsInfo,
} from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import {
    type Network,
    type NetworkConfigDeps,
    type NetworkSymbol,
    getDisplaySymbol,
    getMainnets,
    getNetworkDisplaySymbolName,
    getNetworks,
    isNetworkSymbol,
    selectNetworkConfigDeps,
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

type TradingNetwork = Network & {
    readonly coingeckoId: string;
    readonly tradeCryptoId: string;
};

const getTradingNetwork = (deps: NetworkConfigDeps, networkSymbol: NetworkSymbol): TradingNetwork =>
    ({
        symbol: networkSymbol,
        ...deps.getNetworkConfig(networkSymbol),
    }) as TradingNetwork;

function hasSupportedAddressValidator(
    deps: NetworkConfigDeps,
    platforms: Platforms,
    coins: Coins,
    cryptoId: CryptoId,
    supportedAddressValidatorSymbols: Set<NetworkSymbol>,
) {
    const prodCryptoId = testnetToProdCryptoId(cryptoId);
    const networkSymbol =
        cryptoIdToNetwork(deps, prodCryptoId)?.symbol ??
        getTradingNativeCoinSymbolByCryptoId(platforms, coins, prodCryptoId);

    return (
        networkSymbol !== undefined &&
        isNetworkSymbol(deps, networkSymbol) &&
        supportedAddressValidatorSymbols.has(networkSymbol)
    );
}

function getNonTestnetNetworkSymbol(network?: Network): NetworkSymbol | null {
    return !network || network.testnet ? null : network.symbol;
}

function isAssetWithSupportedNetwork(
    deps: NetworkConfigDeps,
    mainnets: Set<NetworkSymbol>,
    platforms: Platforms,
    coins: Coins,
    cryptoId: CryptoId,
): boolean {
    const networkSymbol =
        cryptoIdToNetwork(deps, cryptoId)?.symbol ??
        getTradingNativeCoinSymbolByCryptoId(platforms, coins, cryptoId);

    return Boolean(
        networkSymbol && isNetworkSymbol(deps, networkSymbol) && mainnets.has(networkSymbol),
    );
}

interface CreateAssetOptionProps {
    cryptoId: CryptoId;
    coinInfo: CoinInfo;
    platformInfo?: PlatformsInfo;
}

export function createAssetOption(
    deps: NetworkConfigDeps,
    { cryptoId, coinInfo, platformInfo }: CreateAssetOptionProps,
): TradingAssetOption | null {
    const { contractAddress = null } = parseCryptoId(cryptoId);
    const network = cryptoIdToNetwork(deps, cryptoId);
    const isNativeToken = Boolean(
        network && (!contractAddress || isCryptoIdForNativeToken(cryptoId)),
    );

    if (isNativeToken && network) {
        const networkConfig = network as TradingNetwork;

        return {
            isNativeToken: true,
            id: networkConfig.tradeCryptoId as CryptoId,
            name: networkConfig.name,
            coingeckoId: networkConfig.coingeckoId,
            symbol: networkConfig.symbol,
            displaySymbol: networkConfig.displaySymbol,
            contractAddress: contractAddress as TradingAssetOptionNativeToken['contractAddress'],
            networkName: networkConfig.name,
            networkSymbol: networkConfig.symbol,
            displaySymbolName: getNetworkDisplaySymbolName(deps, networkConfig.symbol),
        } satisfies TradingAssetOptionNativeToken;
    }

    const networkSymbol = network ? network.symbol : platformInfo?.nativeCoinSymbol;

    // No supported network exists for this token's network symbol, filter it out
    if (!networkSymbol || !isNetworkSymbol(deps, networkSymbol)) {
        return null;
    }

    const networkConfig = getTradingNetwork(deps, networkSymbol);

    const coinInfoSymbol = coinInfo.symbol;

    return {
        isNativeToken: false,
        id: cryptoId,
        name: coinInfo.name,
        symbol: coinInfoSymbol,
        coingeckoId: networkConfig.coingeckoId,
        displaySymbol: getDisplaySymbol(deps, coinInfoSymbol.toUpperCase(), contractAddress),
        contractAddress: contractAddress!,
        networkName: networkConfig.name,
        networkSymbol: networkConfig.symbol,
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
    deps: NetworkConfigDeps,
    networkSymbol: NetworkSymbol,
): TradingAssetOptionNativeToken {
    const network = getTradingNetwork(deps, networkSymbol);

    return {
        isNativeToken: true,
        id: getCryptoId(deps, networkSymbol),
        name: network.name,
        coingeckoId: network.coingeckoId,
        symbol: networkSymbol,
        displaySymbol: network.displaySymbol,
        contractAddress: null,
        networkName: network.name,
        networkSymbol: network.symbol,
        displaySymbolName: getNetworkDisplaySymbolName(deps, network.symbol),
    };
}

export function createAssetTokenOption<
    Token extends Pick<TokenInfo, 'contract' | 'symbol' | 'name'>,
>(
    deps: NetworkConfigDeps,
    networkSymbol: NetworkSymbol,
    token: Token,
): TradingAssetOptionWithContractAddress {
    const network = getTradingNetwork(deps, networkSymbol);

    return {
        id: getCryptoId(deps, networkSymbol, token.contract),
        coingeckoId: network.coingeckoId,

        isNativeToken: false,

        contractAddress: token.contract,
        symbol: token.symbol!,
        name: token.name!,
        displaySymbol: getDisplaySymbol(deps, token.symbol!, token.contract),

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
    const deps = useServices(selectNetworkConfigDeps);
    const { networkModuleRepository } = deps;
    const mainnets = useMemo(
        () =>
            new Set(getMainnets({ allNetworks: getNetworks(deps) }).map(network => network.symbol)),
        [deps],
    );
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
                        isAssetWithSupportedNetwork(deps, mainnets, platforms, coins, cryptoId) &&
                        hasSupportedAddressValidator(
                            deps,
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

                    return createAssetOption(deps, {
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
        [deps, getCoinsAndPlatforms, mainnets, supportedAddressValidatorSymbols],
    );

    const createAssetOptionFromCryptoId = useCallback<(cryptoId?: CryptoId) => TradingAssetOption>(
        cryptoId => {
            const { coins, platforms } = getCoinsAndPlatforms();

            const network = cryptoIdToNetwork(deps, cryptoId);
            const resolvedNetworkSymbol =
                getNonTestnetNetworkSymbol(network) ?? TRADING_DEFAULT_CRYPTO_CURRENCY;
            const defaultAssetOption = createAssetNativeTokenOption(deps, resolvedNetworkSymbol);

            if (cryptoId && coins[cryptoId]) {
                return (
                    createAssetOption(deps, {
                        cryptoId,
                        coinInfo: coins[cryptoId],
                        platformInfo: getTradingPlatformsInfoByCryptoId(platforms, cryptoId),
                    }) ?? defaultAssetOption
                );
            }

            return defaultAssetOption;
        },
        [deps, getCoinsAndPlatforms],
    );

    const resolveAssetTokenOption = useCallback(
        (
            networkSymbol: NetworkSymbol,
            token: Pick<TokenInfo, 'contract' | 'symbol' | 'name'>,
        ): TradingAssetOptionWithContractAddress => {
            const { coins, platforms } = getCoinsAndPlatforms();
            const cryptoId = getCryptoId(deps, networkSymbol, token.contract);

            if (coins?.[cryptoId]) {
                const result = createAssetOption(deps, {
                    cryptoId,
                    coinInfo: coins[cryptoId],
                    platformInfo: getTradingPlatformsInfoByCryptoId(platforms, cryptoId),
                });

                if (result !== null && !result.isNativeToken) {
                    return result;
                }
            }

            return createAssetTokenOption(deps, networkSymbol, token);
        },
        [deps, getCoinsAndPlatforms],
    );

    return { buildAssetOptions, createAssetOptionFromCryptoId, resolveAssetTokenOption };
}
