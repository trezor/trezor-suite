import { useSelector } from 'react-redux';

import { selectDeviceState, selectNumberOfDeviceInstances } from '@suite-common/device';
import { Text } from '@suite-native/atoms';
import { selectShouldFactoryResetBeVisible } from '@suite-native/device';
import { Translation } from '@suite-native/intl';

import { BootloaderModeItemContent } from './BootloaderModeItemContent';
import { DeviceItemContent } from './DeviceItem/DeviceItemContent';

export const DeviceSwitchContent = () => {
    const deviceState = useSelector(selectDeviceState);
    const numberOfDevices = useSelector(selectNumberOfDeviceInstances);
    const shouldFactoryResetBeVisible = useSelector(selectShouldFactoryResetBeVisible);

    if (deviceState) {
        return (
            <DeviceItemContent
                deviceState={deviceState ?? undefined}
                headerTextVariant="highlight"
                variant={numberOfDevices > 1 ? 'walletDetail' : 'simple'}
                isSubHeaderForceHidden={true}
            />
        );
    }

    if (shouldFactoryResetBeVisible) {
        return <BootloaderModeItemContent />;
    }

    return (
        <Text variant="highlight">
            <Translation id="deviceManager.defaultHeader" />
        </Text>
    );
};
