import { FlashList } from '@shopify/flash-list';

import { Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { AssetDetailHeader } from '../components/AssetDetailHeader';

const ASSET_DETAIL_ITEMS: readonly never[] = [];

export const AssetDetailScreen = () => (
    <Screen
        header={
            <ScreenHeader title={<Translation id="moduleAssets.assetDetailScreen.headerTitle" />} />
        }
        isScrollable={false}
        noHorizontalPadding
    >
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
