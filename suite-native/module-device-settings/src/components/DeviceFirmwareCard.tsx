import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    selectDeviceModel,
    selectFirmwareReleaseConfig,
    selectIsDeviceBackedUp,
    selectIsFirmwareUpgradable,
    selectSelectedDevice,
} from '@suite-common/device';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type InlineAlertBoxProps } from '@suite-native/atoms';
import { selectIsFirmwareUpdateFeatureEnabled } from '@suite-native/firmware';
import { Translation } from '@suite-native/intl';
import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import { getFirmwareVersion } from '@trezor/device-utils';
import { isNotNullOrUndefined } from '@trezor/utils';

import { DeviceSettingsItemCard } from './DeviceSettingsItemCard';

type NavigationProps = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceFirmware
>;

export const DeviceFirmwareCard = () => {
    const device = useSelector(selectSelectedDevice);
    const deviceModel = useSelector(selectDeviceModel);
    const deviceReleaseInfo = useSelector(selectFirmwareReleaseConfig);
    const isDeviceBackedUp = useSelector(selectIsDeviceBackedUp);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isFirmwareUpgradable = useSelector(selectIsFirmwareUpgradable);
    const { showToast } = useToast();

    const navigation = useNavigation<NavigationProps>();
    const isFirmwareUpdateEnabled = useSelector(selectIsFirmwareUpdateFeatureEnabled);

    if (!device || !deviceModel) {
        return null;
    }

    const firmwareVersion = getFirmwareVersion(device);

    const handleOnPress = () => {
        if (!isFirmwareUpdateEnabled) {
            showToast({
                intent: 'warning',
                message: <Translation id="firmware.updateNotAvailable" />,
                icon: 'warning',
            });

            return;
        }

        navigation.navigate(DeviceSettingsStackRoutes.DeviceFirmware, {
            closeActionType: 'back',
        });
    };

    const firmwareUpdateProps = ((): InlineAlertBoxProps | undefined => {
        if (!isFirmwareUpdateEnabled || !isDeviceBackedUp) {
            return undefined;
        }

        if (isNotNullOrUndefined(deviceReleaseInfo)) {
            if (isFirmwareUpgradable) {
                return {
                    title: <Translation id="firmware.updateCard.newVersionAvailable" />,
                    variant: 'info',
                    buttonLabel: <Translation id="firmware.firmwareUpdateScreen.updateFirmware" />,
                    onButtonPress: handleOnPress,
                    buttonProps: {
                        isDisabled: isDiscoveryRunning,
                        isLoading: isDiscoveryRunning,
                    },
                } as const;
            }
        }

        return undefined;
    })();

    return (
        <DeviceSettingsItemCard
            icon="database"
            title={<Translation id="firmware.title" />}
            alertBoxProps={firmwareUpdateProps}
            subtitle={<Translation id="firmware.version" values={{ firmwareVersion }} />}
            onPress={handleOnPress}
            testID="@device-firmware/redirectToFirmwareUpdateScreen"
        />
    );
};
