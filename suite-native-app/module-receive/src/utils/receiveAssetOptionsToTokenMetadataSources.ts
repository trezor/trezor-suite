import { type TokenMetadataSource } from '@suite-common/token';
import { type TradingAssetOption } from '@suite-common/trading';

export const receiveAssetOptionsToTokenMetadataSources = (
    assets: readonly TradingAssetOption[],
): TokenMetadataSource[] =>
    assets.flatMap(asset =>
        asset.isNativeToken
            ? []
            : [
                  {
                      networkSymbol: asset.networkSymbol,
                      tokens: [
                          {
                              contract: asset.contractAddress,
                              name: asset.name,
                              symbol: asset.symbol,
                          },
                      ],
                  },
              ],
    );
