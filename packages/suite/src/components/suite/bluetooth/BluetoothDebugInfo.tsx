import { useEffect, useState } from 'react';

import { selectKnownDevices, selectNearbyDevices } from '@suite-common/bluetooth';
import { Code, Icon, InfoSegments, Text, iconSizes } from '@trezor/components';

import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';
import { useSelector } from '../../../hooks/suite';

const TimeAgo = ({ timestamp }: { timestamp: number }) => {
    const [secAgo, setSecAgo] = useState(0);

    useEffect(() => {
        setSecAgo(Math.floor(Date.now() / 1000 - timestamp));
        const interval = setInterval(() => setSecAgo(t => t + 1), 1000);

        return () => clearInterval(interval);
    }, [timestamp]);

    return (
        <Text>
            <Text variant="warning">{secAgo}</Text>&nbsp;s ago
        </Text>
    );
};

type BluetoothDeviceProps = {
    device: DesktopBluetoothDevice;
};

export const BluetoothDebugInfo = ({ device }: BluetoothDeviceProps) => {
    const nearbyDevices = useSelector(selectNearbyDevices);
    const isNearbyDevice = (nearbyDevices ?? []).find(
        nearbyDevice => nearbyDevice.id === device.id,
    );

    const knownDevices = useSelector(selectKnownDevices);
    const isKnownDevice = knownDevices.find(knownDevice => knownDevice.id === device.id);

    return (
        <>
            <InfoSegments>
                {isKnownDevice && (
                    <Icon
                        name="floppyDiskBackFilled"
                        size={iconSizes.medium}
                        variant="destructive"
                    />
                )}
                {isNearbyDevice && (
                    <Icon name="cellSignalFull" size={iconSizes.medium} variant="primary" />
                )}
                <TimeAgo timestamp={device.lastUpdatedTimestamp} />
            </InfoSegments>
            <Text typographyStyle="hint" variant="purple">
                <Code>{device.macAddress}</Code>
            </Text>
        </>
    );
};
