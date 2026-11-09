import React, { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useDeviceLowBatteryAlert } from '@suite-native/device';
import { FirmwareInfoScreenContent, FirmwareInfoScreenFooter } from '@suite-native/firmware';
import { Translation } from '@suite-native/intl';
import {
    type DeviceSettingsStackParamList,
    DynamicScreenHeader,
    type FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes,
    Screen,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes.ConfirmFirmwareUpdate,
    DeviceSettingsStackParamList
>;

export const ConfirmFirmwareUpdateScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const { showLowBatteryAlertIfNecessary } = useDeviceLowBatteryAlert();

    const handleUpdateConfirmation = useCallback(() => {
        if (showLowBatteryAlertIfNecessary()) {
            return;
        }
        navigation.replace(FirmwareUpdateStackRoutes.FirmwareInstallation);
    }, [navigation, showLowBatteryAlertIfNecessary]);

    const handleCancel = () => {
        navigation.goBack();
    };

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="firmware.firmwareInfoScreen.title.update" />}
                    subtitle={<Translation id="firmware.firmwareInfoScreen.subtitle" />}
                    closeActionType="close"
                    closeAction={handleCancel}
                />
            }
            footer={
                <FirmwareInfoScreenFooter
                    onUpdateConfirmation={handleUpdateConfirmation}
                    onCancel={handleCancel}
                />
            }
        >
            <FirmwareInfoScreenContent />
        </Screen>
    );
};
