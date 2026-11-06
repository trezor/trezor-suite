import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';

import { type MyAssetsSection } from '../../hooks/general/useMyAssetsFilteredData';

export const myAssetSectionsToTokenMetadataSources = (
    sections: readonly MyAssetsSection[],
): TokenMetadataSource[] =>
    sections.map(section => ({
        networkSymbol: section.sectionData.symbol,
        tokens: [
            ...section.assets,
            ...section.lowBalanceAssets,
            ...section.nonTradeableAssets,
        ].flatMap(asset =>
            asset.contract
                ? [
                      {
                          contract: toTokenAddress(asset.contract),
                          name: asset.name,
                          symbol: asset.tokenSymbol ?? undefined,
                          decimals: asset.decimals,
                      },
                  ]
                : [],
        ),
    }));
