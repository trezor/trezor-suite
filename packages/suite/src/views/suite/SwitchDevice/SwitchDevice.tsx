import * as deviceUtils from '@suite-common/suite-utils';
import { selectDevice, selectDevices } from '@suite-common/wallet-core';

import { getBackgroundRoute } from 'src/utils/suite/router';
import { ForegroundAppProps } from 'src/types/suite';
import { useSelector } from 'src/hooks/suite';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { SwitchDeviceRenderer } from './SwitchDeviceRenderer';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';

const Flex = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
`;

export const SwitchDevice = ({ cancelable, onCancel }: ForegroundAppProps) => {
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

    const backgroundRoute = getBackgroundRoute();

    return (
        <SwitchDeviceRenderer isCancelable={cancelable} onCancel={onCancel}>
            <Flex>
                {sortedDevices.map((device, index) => (
                    <DeviceItem
                        key={`${device.id}-${device.instance}`}
                        device={device}
                        instances={deviceUtils.getDeviceInstances(device, devices)}
                        backgroundRoute={backgroundRoute}
                        onCancel={onCancel}
                        isCloseButtonVisible={index === 0}
                    />
                ))}
            </Flex>
        </SwitchDeviceRenderer>
    );
};
