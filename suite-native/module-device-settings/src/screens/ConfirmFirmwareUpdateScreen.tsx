import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
    selectHasRunningDiscovery,
    selectIsDeviceBackupRequired,
    selectIsFirmwareUpgradable,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Button, useBottomSheetModal } from '@suite-native/atoms';
import { useDeviceConnectionGuard } from '@suite-native/device-authorization';
import {
    ConfirmBottomSheet,
    FirmwareVersionCard,
    useIsFirmwareUpdateFeatureEnabled,
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
    const { isDeviceConnected } = useDeviceConnectionGuard();
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
        navigation.replace(FirmwareUpdateStackRoutes.FirmwareInfo);
    }, [navigation]);

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
        >
            <FirmwareVersionCard isUpdateRequired={false}>
                {isFirmwareUpgradable && (
                    <Button
                        onPress={handleConfirmButtonPress}
                        colorScheme="blueBold"
                        isDisabled={isDiscoveryRunning || !isFirmwareUpdateEnabled}
                        isLoading={isDiscoveryRunning}
                        testID="@device-firmware/update-button"
                    >
                        <Translation id="firmware.firmwareUpdateScreen.updateFirmware" />
                    </Button>
                )}
            </FirmwareVersionCard>
            <ConfirmBottomSheet
                ref={bottomSheetRef}
                onConfirm={withModalClose(handleUpdateConfirmation)}
                onCheckBackup={withModalClose(navigateToCheckBackup)}
            />
        </Screen>
    );
};
