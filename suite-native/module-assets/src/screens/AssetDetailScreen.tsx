import { FlashList } from '@shopify/flash-list';

import { Box } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';

import { AssetDetailHeader } from '../components/AssetDetailHeader';
import { AssetDetailScreenHeader } from '../components/AssetDetailScreenHeader';

const ASSET_DETAIL_ITEMS: readonly never[] = [];

export const AssetDetailScreen = () => (
    <Screen header={<AssetDetailScreenHeader />} isScrollable={false} noHorizontalPadding>
        <Box flex={1}>
            <FlashList
                data={ASSET_DETAIL_ITEMS}
                renderItem={() => null}
                ListHeaderComponent={<AssetDetailHeader />}
                ListEmptyComponent={null}
                ListFooterComponent={null}
            />
        </Box>
    </Screen>
);
