import React from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsFirmwareUpgradable } from '@suite-common/wallet-core';
import { Box } from '@suite-native/atoms';
import {
    ConfirmFirmwareUpdateScreenContent,
    ConfirmFirmwareUpdateScreenFooter,
} from '@suite-native/firmware';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    DynamicScreenHeader,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';

import { useDeviceConnectionGuard } from '../hooks/useDeviceConnectionGuard';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.ConfirmFirmwareUpdate
>;

export const ConfirmFirmwareUpdateScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { isDeviceConnected } = useDeviceConnectionGuard();
    const isFirmwareUpgradable = useSelector(selectIsFirmwareUpgradable);

    const handleUpdateConfirmation = () => {
        navigation.navigate(DeviceSettingsStackRoutes.FirmwareInstallation);
    };

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
                    <ConfirmFirmwareUpdateScreenFooter
                        onUpdateConfirmation={handleUpdateConfirmation}
                    />
                )
            }
        >
            <Box flex={1}>
                <ConfirmFirmwareUpdateScreenContent />
            </Box>
        </Screen>
    );
};
