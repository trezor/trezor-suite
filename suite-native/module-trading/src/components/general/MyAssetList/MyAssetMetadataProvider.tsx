import { type ReactNode } from 'react';

import { TokenMetadataProvider } from '@suite-native/tokens';

import { type MyAssetsSection } from '../../../hooks/general/useMyAssetsFilteredData';

type MyAssetMetadataProviderProps = {
    sections: readonly MyAssetsSection[];
    children: ReactNode;
};

/** Supplies all asset groups before account sections and rows are rendered. */
export const MyAssetMetadataProvider = ({ sections, children }: MyAssetMetadataProviderProps) => (
    <TokenMetadataProvider
        sources={sections.map(section => ({
            networkSymbol: section.sectionData.symbol,
            tokens: [
                ...section.assets,
                ...section.lowBalanceAssets,
                ...section.nonTradeableAssets,
            ].flatMap(asset =>
                asset.contract
                    ? [
                          {
                              contract: asset.contract,
                              name: asset.name,
                              symbol: asset.tokenSymbol ?? undefined,
                              decimals: asset.decimals,
                          },
                      ]
                    : [],
            ),
        }))}
    >
        {children}
    </TokenMetadataProvider>
);
