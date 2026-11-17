import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type TradingAssetOption } from '@suite-common/trading';

type ReceiveAssetOptionsToTokenMetadataSourcesOptions = {
    /** Set only for assets from Trezor's ranked token catalog. */
    isRecognized?: true;
};

export const receiveAssetOptionsToTokenMetadataSources = (
    assets: readonly TradingAssetOption[],
    { isRecognized }: ReceiveAssetOptionsToTokenMetadataSourcesOptions = {},
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
                              ...(isRecognized && { isRecognized }),
                          },
                      ],
                  },
              ],
    );
