import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
    selectIsDeviceBackupRequired,
    selectIsFirmwareUpgradable,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Box, useBottomSheetModal } from '@suite-native/atoms';
import { useDeviceLowBatteryAlert } from '@suite-native/device';
import { useDeviceConnectionGuard } from '@suite-native/device-authorization';
import {
    ConfirmBottomSheet,
    ConfirmFirmwareUpdateScreenContent,
    ConfirmFirmwareUpdateScreenFooter,
} from '@suite-native/firmware';
import { Translation } from '@suite-native/intl';
import { useNavigateToCheckBackup } from '@suite-native/module-check-backup';
import {
    DeviceOnboardingStackRoutes,
    DeviceSettingsStackParamList,
    DynamicScreenHeader,
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
} from '@suite-native/navigation';

type NavigationProps = CompositeNavigationProp<
    NativeStackNavigationProp<
        FirmwareUpdateStackParamList,
        FirmwareUpdateStackRoutes.ConfirmFirmwareUpdate
    >,
    CompositeNavigationProp<
        NativeStackNavigationProp<DeviceSettingsStackParamList>,
        NativeStackNavigationProp<RootStackParamList>
    >
>;

export const ConfirmFirmwareUpdateScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const { isDeviceConnected } = useDeviceConnectionGuard();
    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);

    const { showAlert } = useAlert();
    const isFirmwareUpgradable = useSelector(selectIsFirmwareUpgradable);

    const { openModal: openCheckBackupModal, bottomSheetRef, closeModal } = useBottomSheetModal();
    const { navigateToCheckBackup } = useNavigateToCheckBackup();

    const { showLowBatteryAlertIfNecessary } = useDeviceLowBatteryAlert();

    const withModalClose = (callback: () => void) => () => {
        closeModal();
        callback();
    };

    const handleUpdateConfirmation = useCallback(() => {
        if (showLowBatteryAlertIfNecessary()) {
            return;
        }
        navigation.navigate(FirmwareUpdateStackRoutes.FirmwareInstallation);
    }, [navigation, showLowBatteryAlertIfNecessary]);

    if (!isDeviceConnected) return;

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
                    title={<Translation id="firmware.firmwareUpdateScreen.title" />}
                    subtitle={<Translation id="firmware.firmwareUpdateScreen.subtitle" />}
                    closeActionType="close"
                />
            }
            footer={
                isFirmwareUpgradable && (
                    <ConfirmFirmwareUpdateScreenFooter
                        onUpdateConfirmation={handleConfirmButtonPress}
                    />
                )
            }
        >
            <Box flex={1}>
                <ConfirmFirmwareUpdateScreenContent />
            </Box>
            <ConfirmBottomSheet
                ref={bottomSheetRef}
                onConfirm={withModalClose(handleUpdateConfirmation)}
                onCheckBackup={withModalClose(navigateToCheckBackup)}
            />
        </Screen>
    );
};
