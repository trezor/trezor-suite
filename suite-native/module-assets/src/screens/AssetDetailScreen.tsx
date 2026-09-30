import { FlashList } from '@shopify/flash-list';

import { Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type AssetsStackParamList,
    type AssetsStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';

import { AssetDetailHeader } from '../components/AssetDetailHeader';

const ASSET_DETAIL_ITEMS: readonly never[] = [];

export const AssetDetailScreen = ({
    route,
}: StackProps<AssetsStackParamList, AssetsStackRoutes.AssetDetail>) => {
    const { networkSymbol, tokenContract } = route.params;

    return (
        <Screen
            header={
                <ScreenHeader
                    title={<Translation id="moduleAssets.assetDetailScreen.headerTitle" />}
                />
            }
            isScrollable={false}
            noHorizontalPadding
        >
            <Box flex={1}>
                <FlashList
                    data={ASSET_DETAIL_ITEMS}
                    renderItem={() => null}
                    ListHeaderComponent={
                        <AssetDetailHeader
                            networkSymbol={networkSymbol}
                            tokenContract={tokenContract}
                        />
                    }
                    ListEmptyComponent={null}
                    ListFooterComponent={null}
                />
            </Box>
        </Screen>
    );
};
