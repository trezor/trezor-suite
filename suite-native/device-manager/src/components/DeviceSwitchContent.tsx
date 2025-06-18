import { useSelector } from 'react-redux';

import {
    selectDeviceState,
    selectIsDeviceInBootloader,
    selectNumberOfDeviceInstances,
} from '@suite-common/wallet-core';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { BootloaderModeItemContent } from './BootloaderModeItemContent';
import { DeviceItemContent } from './DeviceItem/DeviceItemContent';

export const DeviceSwitchContent = () => {
    const deviceState = useSelector(selectDeviceState);
    const isDeviceInBootloader = useSelector(selectIsDeviceInBootloader);
    const numberOfDevices = useSelector(selectNumberOfDeviceInstances);

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

    if (isDeviceInBootloader) {
        return <BootloaderModeItemContent />;
    }

    return (
        <Text variant="highlight">
            <Translation id="deviceManager.defaultHeader" />
        </Text>
    );
};
