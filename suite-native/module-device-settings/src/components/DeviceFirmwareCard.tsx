import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';

import {
    selectDeviceModel,
    selectDeviceReleaseInfo,
    selectHasRunningDiscovery,
    selectIsDeviceBackedUp,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { InlineAlertBoxProps } from '@suite-native/atoms';
import { useIsFirmwareUpdateFeatureEnabled } from '@suite-native/firmware';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { getFirmwareVersion } from '@trezor/device-utils';

import { SettingsItemCard } from './SettingsItemCard';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.ConfirmFirmwareUpdate
>;

export const DeviceFirmwareCard = () => {
    const device = useSelector(selectSelectedDevice);
    const deviceModel = useSelector(selectDeviceModel);
    const deviceReleaseInfo = useSelector(selectDeviceReleaseInfo);
    const isDeviceBackedUp = useSelector(selectIsDeviceBackedUp);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const navigation = useNavigation<NavigationProp>();
    const isFirmwareUpdateEnabled = useIsFirmwareUpdateFeatureEnabled();

    if (!device || !deviceModel) {
        return null;
    }

    const firmwareVersion = getFirmwareVersion(device);

    const handleOnPress = () => {
        navigation.navigate(DeviceSettingsStackRoutes.ConfirmFirmwareUpdate);
    };

    const firmwareUpdateProps = ((): InlineAlertBoxProps | undefined => {
        if (!isFirmwareUpdateEnabled || !isDeviceBackedUp) {
            return undefined;
        }

        if (G.isNotNullable(deviceReleaseInfo)) {
            const isUpgradable = deviceReleaseInfo.isNewer ?? false;

            if (isUpgradable) {
                return {
                    title: <Translation id="firmware.updateCard.newVersionAvailable" />,
                    variant: 'info',
                    buttonLabel: <Translation id="firmware.updateCard.updateButton" />,
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
        <SettingsItemCard
            icon="database"
            title={<Translation id="firmware.title" />}
            alertBoxProps={firmwareUpdateProps}
            subtitle={<Translation id="firmware.version" values={{ firmwareVersion }} />}
            onPress={handleOnPress}
        />
    );
};
