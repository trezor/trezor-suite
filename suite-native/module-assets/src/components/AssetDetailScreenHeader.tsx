import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type AssetsRootState, selectAssetTokenInfo } from '@suite-common/assets';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { IconButton, useBottomSheetModal } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import {
    type AssetsStackParamList,
    type AssetsStackRoutes,
    ScreenHeader,
} from '@suite-native/navigation';

import { AssetDetailScreenHeaderContent } from './AssetDetailScreenHeaderContent';
import { AssetSettingsBottomSheet } from './AssetSettingsBottomSheet';

export const AssetDetailScreenHeader = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const assetTokenInfo = useSelector((state: AssetsRootState) =>
        selectAssetTokenInfo(state, networkSymbol, tokenContract),
    );
    const { bottomSheetRef, openModal } = useBottomSheetModal();
    const { translate } = useTranslate();
    const assetDisplaySymbol = getDisplaySymbol(
        assetTokenInfo?.symbol ?? networkSymbol,
        tokenContract,
    );

    return (
        <>
            <ScreenHeader
                customContent={
                    <AssetDetailScreenHeaderContent assetDisplaySymbol={assetDisplaySymbol} />
                }
                rightIcon={
                    <IconButton
                        iconName="dotsThree"
                        intent="neutral"
                        priority="secondary"
                        size="medium"
                        accessibilityRole="button"
                        accessibilityLabel={translate(
                            'moduleAssets.assetDetailScreen.settings.openButtonAccessibilityLabel',
                        )}
                        onPress={openModal}
                        testID="@asset-detail/settings-button"
                    />
                }
            />

            <AssetSettingsBottomSheet
                ref={bottomSheetRef}
                assetDisplaySymbol={assetDisplaySymbol}
                networkSymbol={networkSymbol}
                tokenContract={tokenContract}
            />
        </>
    );
};
