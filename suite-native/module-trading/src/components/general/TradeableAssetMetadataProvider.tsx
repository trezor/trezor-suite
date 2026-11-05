import { type ReactNode } from 'react';

import { cryptoIdToNetworkSymbol, isSendingEvmNativeToken } from '@suite-common/trading';
import { TokenMetadataProvider } from '@suite-native/tokens';
import { type TradeableAsset } from '@suite-native/trading-types';

type TradeableAssetMetadataProviderProps = {
    assets: readonly (TradeableAsset | undefined)[];
    children: ReactNode;
};

/** Supplies a whole trading asset collection, including assets not held in an account. */
export const TradeableAssetMetadataProvider = ({
    assets,
    children,
}: TradeableAssetMetadataProviderProps) => (
    <TokenMetadataProvider
        sources={assets.flatMap(asset => {
            const networkSymbol = cryptoIdToNetworkSymbol(asset?.cryptoId);

            return asset?.contractAddress &&
                networkSymbol &&
                !isSendingEvmNativeToken(asset.cryptoId)
                ? [
                      {
                          networkSymbol,
                          tokens: [
                              {
                                  contract: asset.contractAddress,
                                  name: asset.name,
                                  symbol: asset.symbol,
                                  decimals: asset.decimals,
                              },
                          ],
                      },
                  ]
                : [];
        })}
    >
        {children}
    </TokenMetadataProvider>
);
