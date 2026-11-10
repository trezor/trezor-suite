import { type TokenMetadataSource } from '@suite-common/token';
import { cryptoIdToNetworkSymbol, isSendingEvmNativeToken } from '@suite-common/trading';
import { type TradeableAsset } from '@suite-native/trading-types';

export const tradeableAssetsToTokenMetadataSources = (
    assets: readonly (TradeableAsset | undefined)[],
): TokenMetadataSource[] =>
    assets.flatMap(asset => {
        const networkSymbol = cryptoIdToNetworkSymbol(asset?.cryptoId);

        return asset?.contractAddress && networkSymbol && !isSendingEvmNativeToken(asset.cryptoId)
            ? [
                  {
                      networkSymbol,
                      tokens: [
                          {
                              // `symbol` is deliberately omitted. `asset.symbol` is already
                              // truncated for display, which would hide a URL from masking.
                              // The context inherits the full catalog symbol for this contract
                              // from the parent `TradingMetadataProvider` instead.
                              contract: asset.contractAddress,
                              name: asset.name,
                              decimals: asset.decimals,
                          },
                      ],
                  },
              ]
            : [];
    });
