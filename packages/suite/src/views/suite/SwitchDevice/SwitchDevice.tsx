import { useState } from 'react';

import * as deviceUtils from '@suite-common/suite-utils';
import { selectDevice, selectDevices } from '@suite-common/wallet-core';
import { Button, Column, Icon, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ForegroundAppProps } from 'src/types/suite';
import { useSelector } from 'src/hooks/suite';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { SwitchDeviceModal } from './SwitchDeviceModal';
import { BluetoothConnect } from '../../../components/suite/bluetooth/BluetoothConnect';

export const SwitchDevice = ({ onCancel }: ForegroundAppProps) => {
    const [isBluetoothMode, setIsBluetoothMode] = useState(false);

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
            {isBluetoothMode ? (
                <BluetoothConnect onClose={() => setIsBluetoothMode(false)} uiMode="card" />
            ) : (
                <Column gap={spacings.md}>
                    {sortedDevices.map((device, index) => (
                        <DeviceItem
                            key={`${device.id}-${device.instance}`}
                            device={device}
                            instances={deviceUtils.getDeviceInstances(device, devices)}
                            onCancel={onCancel}
                            isFullHeaderVisible={index === 0}
                        />
                    ))}
                    <Button variant="tertiary" isFullWidth onClick={() => setIsBluetoothMode(true)}>
                        <Row justifyContent="center" alignItems="center" gap={spacings.xs}>
                            <Icon name="bluetooth" size="mediumLarge" />
                            <Text typographyStyle="body">Pair Trezor Safe 7</Text>
                        </Row>
                    </Button>
                </Column>
            )}
        </SwitchDeviceModal>
    );
};
