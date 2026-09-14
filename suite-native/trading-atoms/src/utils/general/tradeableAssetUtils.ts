import { type NetworkConfigDeps } from '@suite-common/networks';
import type { CoinInfo, CryptoId } from 'invity-api';

import {
    cryptoIdToNetworkSymbol,
    isCryptoIdForNativeToken,
    parseCryptoId,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { type TradeableAsset } from '@suite-native/trading-types';

export const coinInfoToTradeableAsset = (
    networkConfigDeps: NetworkConfigDeps,
    cryptoId: CryptoId,
    coinInfo: CoinInfo,
): TradeableAsset => {
    const { services, symbol, ...info } = coinInfo;
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const isEthNativeCoin = symbol === 'eth' && isCryptoIdForNativeToken(cryptoId);

    const tokenContractAddress = isEthNativeCoin ? undefined : (contractAddress as TokenAddress);

    return {
        cryptoId,
        symbol: getDisplaySymbol(networkConfigDeps, symbol.toUpperCase(), tokenContractAddress),
        contractAddress: tokenContractAddress,
        networkId,
        ...info,
    };
};

export const getSymbolFromTradeableAsset = (
    networkConfigDeps: NetworkConfigDeps,
    asset: TradeableAsset | undefined,
) => (asset?.cryptoId ? cryptoIdToNetworkSymbol(networkConfigDeps, asset.cryptoId) : undefined);
