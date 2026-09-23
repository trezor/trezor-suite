import { FlashList } from '@shopify/flash-list';

import { Box } from '@suite-native/atoms';

import { type PortfolioAssetItem, PortfolioAssetListItem } from './PortfolioAssetListItem';
import { PortfolioAssetsHeader } from './PortfolioAssetsHeader';

const PORTFOLIO_ASSET_ITEMS: readonly PortfolioAssetItem[] = [];

export const PortfolioAssetsContent = () => (
    <Box flex={1}>
        <FlashList
            testID="@home/portfolio-assets"
            data={PORTFOLIO_ASSET_ITEMS}
            renderItem={PortfolioAssetListItem}
            keyExtractor={item => item.id}
            ListHeaderComponent={PortfolioAssetsHeader}
            ListEmptyComponent={null}
            ListFooterComponent={null}
        />
    </Box>
);
