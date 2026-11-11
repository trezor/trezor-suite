import { type TokenMetadataSource } from '@suite-common/token';
import { type TradingAssetOption } from '@suite-common/trading';

/** Catalog tokens as token metadata, so that one the user does not hold still resolves. */
export const getTradingAssetsTokenMetadataSources = (
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
