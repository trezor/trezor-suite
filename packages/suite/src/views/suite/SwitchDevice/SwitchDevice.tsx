import * as deviceUtils from '@suite-common/suite-utils';
import { selectDevice, selectDevices } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';

import { ForegroundAppProps } from 'src/types/suite';
import { useSelector } from 'src/hooks/suite';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { SwitchDeviceModal } from './SwitchDeviceModal';
import { spacings } from '@trezor/theme';

export const SwitchDevice = ({ onCancel }: ForegroundAppProps) => {
    const selectedDevice = useSelector(selectDevice);
    const devices = useSelector(selectDevices);

    // exclude selectedDevice from list, because other devices could have a higher priority
    // and we want to have selectedDevice on top
    const sortedDevices = deviceUtils
        .getFirstDeviceInstance(devices)
        .filter(d => !deviceUtils.isSelectedDevice(selectedDevice, d));

    // append selectedDevice at top of the list
    if (selectedDevice) {
        sortedDevices.unshift(selectedDevice);
    }

    return (
        <SwitchDeviceModal isAnimationEnabled onCancel={onCancel}>
            <Column gap={spacings.xs} alignItems="stretch">
                {sortedDevices.map((device, index) => (
                    <DeviceItem
                        key={`${device.id}-${device.instance}`}
                        device={device}
                        instances={deviceUtils.getDeviceInstances(device, devices)}
                        onCancel={onCancel}
                        isFullHeaderVisible={index === 0}
                    />
                ))}
            </Column>
        </SwitchDeviceModal>
    );
};
