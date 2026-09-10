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
import {
    cryptoIdToNetwork,
    getCryptoId,
    isCryptoIdForNativeToken,
    parseCryptoId,
    testnetToProdCryptoId,
} from '../utils';
import {
    getTradingNativeCoinSymbolByCryptoId,
    getTradingPlatformsInfoByCryptoId,
} from './infoUtils';

const emptyCoins: Coins = {};
const emptyPlatforms: Platforms = {};
const mainnets = new Set(getMainnets().map(network => network.symbol));

function hasSupportedAddressValidator(
    platforms: Platforms,
    coins: Coins,
    cryptoId: CryptoId,
    supportedAddressValidatorSymbols: ReadonlySet<NetworkSymbol>,
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
            coingeckoId: networkConfig.coingeckoId,
            symbol: networkConfig.symbol,
            displaySymbol: networkConfig.displaySymbol,
            contractAddress: contractAddress as TradingAssetOptionNativeToken['contractAddress'],
            networkName: networkConfig.name,
            networkSymbol: networkConfig.symbol,
            displaySymbolName: getNetworkDisplaySymbolName(networkConfig.symbol),
        } satisfies TradingAssetOptionNativeToken;
    }

    const networkSymbol = network ? network.symbol : platformInfo?.nativeCoinSymbol;

    // No supported network exists for this token's network symbol, filter it out
    if (!networkSymbol || !isNetworkSymbol(networkSymbol)) {
        return null;
    }

    const networkConfig = getNetwork(networkSymbol) as NetworkConfigWithoutTestnets;
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
        networkSymbol: networkConfig.symbol,
        displaySymbolName: coinInfo.name,
    } satisfies TradingAssetOptionWithContractAddress;
}

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
        displaySymbolName: getNetworkDisplaySymbolName(network.symbol),
    };
}

function createAssetTokenOption<Token extends Pick<TokenInfo, 'contract' | 'symbol' | 'name'>>(
    networkSymbol: NetworkSymbol,
    token: Token,
): TradingAssetOptionWithContractAddress {
    const network = getNetwork(networkSymbol) as NetworkConfigWithoutTestnets;

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

interface BuildAssetOptionsParams {
    coins: Coins | undefined;
    platforms: Platforms | undefined;
    includedCryptoIds?: ReadonlySet<CryptoId>;
    supportedAddressValidatorSymbols: readonly NetworkSymbol[];
}

export function buildAssetOptions({
    coins = emptyCoins,
    platforms = emptyPlatforms,
    includedCryptoIds = new Set(),
    supportedAddressValidatorSymbols,
}: BuildAssetOptionsParams) {
    const supportedAddressValidatorSymbolsSet = new Set(supportedAddressValidatorSymbols);
    const assets = Array.from(includedCryptoIds)
        .filter(
            cryptoId =>
                isAssetWithSupportedNetwork(platforms, coins, cryptoId) &&
                hasSupportedAddressValidator(
                    platforms,
                    coins,
                    cryptoId,
                    supportedAddressValidatorSymbolsSet,
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

    return { assets, networks };
}

interface CreateAssetOptionFromCryptoIdParams {
    coins: Coins | undefined;
    platforms: Platforms | undefined;
    cryptoId?: CryptoId;
}

export function createAssetOptionFromCryptoId({
    coins = emptyCoins,
    platforms = emptyPlatforms,
    cryptoId,
}: CreateAssetOptionFromCryptoIdParams): TradingAssetOption {
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
}

interface ResolveAssetTokenOptionParams {
    coins: Coins | undefined;
    platforms: Platforms | undefined;
    networkSymbol: NetworkSymbol;
    token: Pick<TokenInfo, 'contract' | 'symbol' | 'name'>;
}

export function resolveAssetTokenOption({
    coins = emptyCoins,
    platforms = emptyPlatforms,
    networkSymbol,
    token,
}: ResolveAssetTokenOptionParams): TradingAssetOptionWithContractAddress {
    const cryptoId = getCryptoId(networkSymbol, token.contract);

    if (coins[cryptoId]) {
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
}
