import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
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
                              contract: toTokenAddress(asset.contractAddress),
                              name: asset.name,
                              symbol: asset.symbol,
                          },
                      ],
                  },
              ],
    );
