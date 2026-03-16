import { forwardRef, useCallback } from 'react';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useNavigation } from '@react-navigation/native';

import { BottomSheetModal, Button, Text, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect, { UI_RESPONSE } from '@trezor/connect';

type WalletBackupNotSetWarningBottomSheetProps = {
    onConfirm?: () => void;
    onClose?: () => void;
};

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    RootStackRoutes.DeviceOnboardingStack,
    RootStackParamList
>;

export const WalletBackupNotSetWarningBottomSheet = forwardRef<
    BottomSheetModalMethods,
    WalletBackupNotSetWarningBottomSheetProps
>(({ onConfirm, onClose }, ref) => {
    const navigation = useNavigation<NavigationProps>();

    const handleContinueAnyway = useCallback(() => {
        // When Trezor has no backup, it awaits confirmation to continue.
        TrezorConnect.uiResponse({
            type: UI_RESPONSE.RECEIVE_CONFIRMATION,
            payload: true,
        });
        onConfirm?.();
    }, [onConfirm]);

    const handleCreateBackup = useCallback(() => {
        navigation.navigate(RootStackRoutes.DeviceOnboardingStack, {
            screen: DeviceOnboardingStackRoutes.WalletBackupTutorial,
        });
        onClose?.();
    }, [navigation, onClose]);

    return (
        <BottomSheetModal ref={ref}>
            <VStack spacing="sp24" paddingHorizontal="sp8" paddingBottom="sp24">
                <TitleHeader
                    textAlign="center"
                    title={<Translation id="moduleDevice.noBackupModal.title" />}
                />

                <Text textAlign="center">
                    <Translation id="moduleDevice.noBackupModal.subtitle" />
                </Text>

                <VStack spacing="sp12">
                    <Button intent="warning" priority="secondary" onPress={handleContinueAnyway}>
                        <Translation id="moduleDevice.noBackupModal.continue" />
                    </Button>
                    <Button intent="warning" priority="primary" onPress={handleCreateBackup}>
                        <Translation id="moduleDevice.noBackupModal.cta" />
                    </Button>
                </VStack>
            </VStack>
        </BottomSheetModal>
    );
});
