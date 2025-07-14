import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsFirmwareUpgradable } from '@suite-common/wallet-core';
import { Box, useBottomSheetModal } from '@suite-native/atoms';
import {
    ConfirmBottomSheet,
    ConfirmFirmwareUpdateScreenContent,
    ConfirmFirmwareUpdateScreenFooter,
} from '@suite-native/firmware';
import { Translation } from '@suite-native/intl';
import { useNavigateToCheckBackup } from '@suite-native/module-check-backup';
import {
    DynamicScreenHeader,
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';

import { useDeviceConnectionGuard } from '../hooks/useDeviceConnectionGuard';

type NavigationProp = StackNavigationProps<
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes.ConfirmFirmwareUpdate
>;

export const ConfirmFirmwareUpdateScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { isDeviceConnected } = useDeviceConnectionGuard();
    const isFirmwareUpgradable = useSelector(selectIsFirmwareUpgradable);

    const { openModal, bottomSheetRef, closeModal } = useBottomSheetModal();
    const { navigateToCheckBackup } = useNavigateToCheckBackup();

    const withModalClose = (callback: () => void) => () => {
        closeModal();
        callback();
    };

    const handleUpdateConfirmation = useCallback(() => {
        navigation.navigate(FirmwareUpdateStackRoutes.FirmwareInstallation);
    }, [navigation]);

    if (!isDeviceConnected) return;

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
                    <ConfirmFirmwareUpdateScreenFooter onUpdateConfirmation={openModal} />
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
                onCancel={closeModal}
            />
        </Screen>
    );
};
