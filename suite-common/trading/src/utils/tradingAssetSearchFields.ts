import { type TradeableAssetSearchFields } from './tradeableAssetListUtils';
import { type TradingAssetOption } from '../types';

export const getTradingAssetSearchFields = (
    asset: TradingAssetOption,
): TradeableAssetSearchFields => ({
    name: asset.displayName,
    symbol: asset.displaySymbol,
    networkName: asset.networkName,
    networkSymbol: asset.networkSymbol,
    contractAddress: asset.contractAddress ?? '',
});
