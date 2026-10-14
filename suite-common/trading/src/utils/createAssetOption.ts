import { type CoinInfo, type CryptoId, type PlatformsInfo } from 'invity-api';

import { type NetworkMetadata } from '@suite-common/networks';
import { getDisplaySymbol } from '@suite-common/wallet-config';

import {
    type TradingAssetOption,
    type TradingAssetOptionNativeToken,
    type TradingAssetOptionWithContractAddress,
} from '../types';
import { isCryptoIdForNativeToken, parseCryptoId } from '../utils';

interface CreateAssetOptionProps {
    cryptoId: CryptoId;
    coinInfo: CoinInfo;
    platformInfo?: PlatformsInfo;
    networkConfigs: readonly NetworkMetadata[];
}

export function createAssetOption({
    cryptoId,
    coinInfo,
    platformInfo,
    networkConfigs,
}: CreateAssetOptionProps): TradingAssetOption | null {
    const { networkId, contractAddress = null } = parseCryptoId(cryptoId);
    const network = networkConfigs.find(config =>
        contractAddress ? config.coingeckoId === networkId : config.tradeCryptoId === networkId,
    );
    const networkConfig =
        network ?? networkConfigs.find(config => config.symbol === platformInfo?.nativeCoinSymbol);

    if (!networkConfig || networkConfig.testnet || !networkConfig.coingeckoId) {
        return null;
    }

    const networkSymbol = networkConfig.symbol;
    const isNativeToken = Boolean(
        network && (!contractAddress || isCryptoIdForNativeToken(cryptoId)),
    );

    if (isNativeToken) {
        if (!networkConfig.tradeCryptoId) {
            return null;
        }

        return {
            isNativeToken: true,
            id: networkConfig.tradeCryptoId as CryptoId,
            name: networkConfig.name,
            coingeckoId: networkConfig.coingeckoId,
            symbol: networkSymbol,
            displaySymbol: networkConfig.displaySymbol,
            contractAddress: contractAddress as TradingAssetOptionNativeToken['contractAddress'],
            networkName: networkConfig.name,
            networkSymbol,
            displaySymbolName: networkConfig.displaySymbolName || networkConfig.name,
        } satisfies TradingAssetOptionNativeToken;
    }

    if (!contractAddress) {
        return null;
    }

    const coinInfoSymbol = coinInfo.symbol;

    return {
        isNativeToken: false,
        id: cryptoId,
        name: coinInfo.name,
        symbol: coinInfoSymbol,
        coingeckoId: networkConfig.coingeckoId,
        displaySymbol: getDisplaySymbol(coinInfoSymbol.toUpperCase(), contractAddress),
        contractAddress,
        networkName: networkConfig.name,
        networkSymbol,
        displaySymbolName: coinInfo.name,
    } satisfies TradingAssetOptionWithContractAddress;
}
