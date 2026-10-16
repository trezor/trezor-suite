import { useEffect, useRef } from 'react';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type AssetsStackParamList,
    type AssetsStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { AssetDetailHeader } from '../components/AssetDetailHeader';
import { useAssetDetailAsset } from '../hooks/useAssetDetailAsset';

const ASSET_DETAIL_ITEMS: readonly never[] = [];

export const AssetDetailScreen = () => {
    const navigation =
        useNavigation<StackNavigationProps<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>();
    const { networkSymbol } = useAssetDetailAsset();
    const hasShownAsset = useRef(false);

    useEffect(() => {
        if (networkSymbol !== undefined) {
            hasShownAsset.current = true;
        } else if (hasShownAsset.current) {
            hasShownAsset.current = false;
            navigation.goBack();
        }
    }, [navigation, networkSymbol]);

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
                    ListHeaderComponent={<AssetDetailHeader />}
                    ListEmptyComponent={null}
                    ListFooterComponent={null}
                />
            </Box>
        </Screen>
    );
};
