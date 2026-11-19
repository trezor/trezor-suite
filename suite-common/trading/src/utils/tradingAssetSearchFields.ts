import { type TokenMetadataByNetwork } from '@suite-common/token';
import { getNetwork, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';

import { type TradeableAssetSearchFields } from './tradeableAssetListUtils';
import { type TradingAssetOption } from '../types';

export const getTradingAssetSearchFields = (
    asset: TradingAssetOption,
    tokensByNetwork: TokenMetadataByNetwork,
): TradeableAssetSearchFields => {
    const token = asset.isNativeToken
        ? undefined
        : tokensByNetwork.get(asset.networkSymbol)?.get(asset.contractAddress);

    return {
        name: asset.isNativeToken
            ? getNetworkDisplaySymbolName(asset.networkSymbol)
            : (token?.name ?? ''),
        symbol: asset.isNativeToken
            ? getNetwork(asset.networkSymbol).displaySymbol
            : (token?.symbol ?? ''),
        networkName: asset.networkName,
        networkSymbol: asset.networkSymbol,
        contractAddress: asset.contractAddress ?? '',
    };
};
