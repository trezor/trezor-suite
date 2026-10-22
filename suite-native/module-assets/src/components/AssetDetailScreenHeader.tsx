import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { type AssetsRootState, selectAssetTokenInfo } from '@suite-common/assets';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { IconButton, useBottomSheetModal } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    AccountsStackRoutes,
    AppTabsRoutes,
    type AssetsStackParamList,
    type AssetsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { AssetSettingsBottomSheet } from './AssetSettingsBottomSheet';

type NavigationProps = StackToStackCompositeNavigationProps<
    AssetsStackParamList,
    AssetsStackRoutes.AssetDetail,
    RootStackParamList
>;

export const AssetDetailScreenHeader = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const assetTokenInfo = useSelector((state: AssetsRootState) =>
        selectAssetTokenInfo(state, networkSymbol, tokenContract),
    );
    const navigation = useNavigation<NavigationProps>();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const { translate } = useTranslate();
    const assetDisplaySymbol = getDisplaySymbol(
        assetTokenInfo?.symbol ?? networkSymbol,
        tokenContract,
    );

    const handleAccountsPress = () => {
        closeModal();

        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.AccountsStack,
            params: {
                screen: AccountsStackRoutes.Accounts,
                params: { networksFilter: [networkSymbol] },
            },
        });
    };

    return (
        <>
            <ScreenHeader
                title={<Translation id="moduleAssets.assetDetailScreen.headerTitle" />}
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
                onAccountsPress={handleAccountsPress}
            />
        </>
    );
};
