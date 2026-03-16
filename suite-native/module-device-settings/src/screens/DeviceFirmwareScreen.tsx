import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceBackupRequired, selectIsFirmwareUpgradable } from '@suite-common/device';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Button, VStack, useBottomSheetModal } from '@suite-native/atoms';
import {
    ConfirmBottomSheet,
    FirmwareLanguageCard,
    FirmwareVersionCard,
    selectIsFirmwareUpdateFeatureEnabled,
} from '@suite-native/firmware';
import { Translation } from '@suite-native/intl';
import { useNavigateToCheckBackup } from '@suite-native/module-check-backup';
import {
    DeviceOnboardingStackRoutes,
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    DynamicScreenHeader,
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackToStackCompositeScreenProps,
} from '@suite-native/navigation';

export const DeviceFirmwareScreen = ({
    navigation,
    route: { params },
}: StackToStackCompositeScreenProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceFirmware,
    RootStackParamList
>) => {
    const { showAlert } = useAlert();
    const { openModal: openCheckBackupModal, bottomSheetRef, closeModal } = useBottomSheetModal();
    const { navigateToCheckBackup } = useNavigateToCheckBackup();

    const isFirmwareUpgradable = useSelector(selectIsFirmwareUpgradable);
    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isFirmwareUpdateEnabled = useSelector(selectIsFirmwareUpdateFeatureEnabled);

    const withModalClose = (callback: () => void) => () => {
        closeModal();
        callback();
    };

    const handleUpdateConfirmation = useCallback(() => {
        navigation.navigate(DeviceSettingsStackRoutes.FirmwareUpdateStack);
    }, [navigation]);

    const handleConfirmButtonPress = () => {
        if (isDeviceBackupRequired) {
            showAlert({
                title: <Translation id="moduleDeviceSettings.firmware.noBackupAlert.title" />,
                description: (
                    <Translation id="moduleDeviceSettings.firmware.noBackupAlert.description" />
                ),
                primaryButtonTitle: (
                    <Translation id="moduleDeviceSettings.firmware.noBackupAlert.primaryButton" />
                ),
                primaryButtonVariant: 'redBold',
                onPressPrimaryButton: () => {
                    navigation.navigate(RootStackRoutes.DeviceOnboardingStack, {
                        screen: DeviceOnboardingStackRoutes.WalletBackupTutorial,
                    });
                },
                secondaryButtonTitle: (
                    <Translation id="moduleDeviceSettings.firmware.noBackupAlert.secondaryButton" />
                ),
                secondaryButtonVariant: 'redElevation1',
                onPressSecondaryButton: handleUpdateConfirmation,
            });
        } else {
            openCheckBackupModal();
        }
    };

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleDeviceSettings.firmware.title" />}
                    subtitle={<Translation id="moduleDeviceSettings.firmware.subtitle" />}
                    closeActionType={params.closeActionType}
                />
            }
        >
            <VStack spacing="sp16">
                <FirmwareVersionCard isUpdateRequired={false}>
                    {isFirmwareUpgradable && (
                        <Button
                            onPress={handleConfirmButtonPress}
                            colorScheme="blueBold"
                            isDisabled={isDiscoveryRunning || !isFirmwareUpdateEnabled}
                            isLoading={isDiscoveryRunning}
                            testID="@device-firmware/update-button"
                        >
                            <Translation id="moduleDeviceSettings.firmware.updateFirmwareButton" />
                        </Button>
                    )}
                </FirmwareVersionCard>
                <FirmwareLanguageCard />
            </VStack>
            <ConfirmBottomSheet
                ref={bottomSheetRef}
                onConfirm={withModalClose(handleUpdateConfirmation)}
                onCheckBackup={withModalClose(navigateToCheckBackup)}
            />
        </Screen>
    );
};
