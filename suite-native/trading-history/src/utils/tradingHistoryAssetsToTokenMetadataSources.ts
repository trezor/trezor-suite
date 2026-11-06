import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';

import { type TradingHistoryDetailAsset } from '../hooks/useTradingHistoryDetailInfo';

export const tradingHistoryAssetsToTokenMetadataSources = (
    assets: readonly (TradingHistoryDetailAsset | undefined)[],
): TokenMetadataSource[] =>
    assets.flatMap(asset =>
        asset?.type === 'crypto' && asset.contractAddress
            ? [
                  {
                      networkSymbol: asset.networkSymbol,
                      tokens: [
                          {
                              contract: toTokenAddress(asset.contractAddress),
                              name: asset.name,
                              symbol: asset.displaySymbol,
                          },
                      ],
                  },
              ]
            : [],
    );
