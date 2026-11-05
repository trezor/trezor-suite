import { type ReactNode } from 'react';

import { cryptoIdToNetworkSymbol, isSendingEvmNativeToken } from '@suite-common/trading';
import { TokenMetadataProvider } from '@suite-native/tokens';
import { type TradeableAsset } from '@suite-native/trading-types';

type TradeableAssetMetadataProviderProps = {
    asset: TradeableAsset | undefined;
    children: ReactNode;
};

/** Supplies a selected trading asset's metadata to all consumers in its form. */
export const TradeableAssetMetadataProvider = ({
    asset,
    children,
}: TradeableAssetMetadataProviderProps) => {
    const networkSymbol = cryptoIdToNetworkSymbol(asset?.cryptoId);

    if (!asset?.contractAddress || !networkSymbol || isSendingEvmNativeToken(asset.cryptoId)) {
        return children;
    }

    return (
        <TokenMetadataProvider
            sources={[
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
            ]}
        >
            {children}
        </TokenMetadataProvider>
    );
};
