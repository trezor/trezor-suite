import { IconButton, useBottomSheetModal } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';

import { useOpenAssetDetailAccounts } from './AssetDetailAccountsBottomSheetProvider';
import { AssetDetailScreenHeaderContent } from './AssetDetailScreenHeaderContent';
import { AssetSettingsBottomSheet } from './AssetSettingsBottomSheet';

export const AssetDetailScreenHeader = () => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const openAccountsModal = useOpenAssetDetailAccounts();
    const { translate } = useTranslate();

    return (
        <>
            <ScreenHeader
                customContent={<AssetDetailScreenHeaderContent />}
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
                onOpenAccounts={openAccountsModal}
                onClose={closeModal}
            />
        </>
    );
};
