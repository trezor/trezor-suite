import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
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
                              contract: toTokenAddress(asset.contractAddress),
                              name: asset.name,
                              symbol: asset.symbol,
                              decimals: asset.decimals,
                          },
                      ],
                  },
              ]
            : [];
    });
