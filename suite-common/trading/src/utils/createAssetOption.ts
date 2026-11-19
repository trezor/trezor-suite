import { type CoinInfo, type CryptoId, type PlatformsInfo } from 'invity-api';

import { type NetworkMetadata } from '@suite-common/networks';
import { toTokenAddress } from '@suite-common/tokens';

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
            coingeckoId: networkConfig.coingeckoId,
            contractAddress: contractAddress as TradingAssetOptionNativeToken['contractAddress'],
            networkName: networkConfig.name,
            networkSymbol,
            name: networkConfig.displaySymbolName || networkConfig.name,
            symbol: networkConfig.displaySymbol,
        } satisfies TradingAssetOptionNativeToken;
    }

    if (!contractAddress) {
        return null;
    }

    return {
        isNativeToken: false,
        id: cryptoId,
        coingeckoId: networkConfig.coingeckoId,
        contractAddress: toTokenAddress(contractAddress),
        networkName: networkConfig.name,
        networkSymbol,
        name: coinInfo.name,
        symbol: coinInfo.symbol.toUpperCase(),
    } satisfies TradingAssetOptionWithContractAddress;
}
