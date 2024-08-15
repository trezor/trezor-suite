import * as deviceUtils from '@suite-common/suite-utils';
import { selectDevice, selectDevices } from '@suite-common/wallet-core';
import { NewModal } from '@trezor/components';

import { ForegroundAppProps } from 'src/types/suite';
import { useSelector } from 'src/hooks/suite';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { SwitchDeviceModal } from './SwitchDeviceModal';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';

const Flex = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
`;

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
        <NewModal.Backdrop onClick={onCancel} alignment={{ x: 'left', y: 'top' }} padding={5}>
            <SwitchDeviceModal isAnimationEnabled onCancel={onCancel}>
                <Flex>
                    {sortedDevices.map((device, index) => (
                        <DeviceItem
                            key={`${device.id}-${device.instance}`}
                            device={device}
                            instances={deviceUtils.getDeviceInstances(device, devices)}
                            onCancel={onCancel}
                            isFullHeaderVisible={index === 0}
                        />
                    ))}
                </Flex>
            </SwitchDeviceModal>
        </NewModal.Backdrop>
    );
};
