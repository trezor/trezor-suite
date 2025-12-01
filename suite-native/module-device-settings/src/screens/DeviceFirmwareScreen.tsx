import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    selectHasRunningDiscovery,
    selectIsDeviceBackupRequired,
    selectIsFirmwareUpgradable,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Button, VStack, useBottomSheetModal } from '@suite-native/atoms';
import {
    ConfirmBottomSheet,
    FirmwareLanguageCard,
    FirmwareVersionCard,
    useIsFirmwareUpdateFeatureEnabled,
} from '@suite-native/firmware';
import { Translation } from '@suite-native/intl';
import { useNavigateToCheckBackup } from '@suite-native/module-check-backup';
import {
    DeviceOnboardingStackRoutes,
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    DynamicScreenHeader,
    FirmwareUpdateStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceFirmware,
    RootStackParamList
>;

export const DeviceFirmwareScreen = () => {
    const isFirmwareUpdateEnabled = useIsFirmwareUpdateFeatureEnabled();

    const { showAlert } = useAlert();
    const { openModal: openCheckBackupModal, bottomSheetRef, closeModal } = useBottomSheetModal();
    const { navigateToCheckBackup } = useNavigateToCheckBackup();
    const navigation = useNavigation<NavigationProps>();

    const isFirmwareUpgradable = useSelector(selectIsFirmwareUpgradable);
    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const withModalClose = (callback: () => void) => () => {
        closeModal();
        callback();
    };

    const handleUpdateConfirmation = useCallback(() => {
        navigation.replace(DeviceSettingsStackRoutes.FirmwareUpdateStack, {
            screen: FirmwareUpdateStackRoutes.ConfirmFirmwareUpdate,
        });
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
                    closeActionType="close"
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
