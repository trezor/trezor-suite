import { useEffect, useState } from 'react';

import { selectKnownDevices, selectNearbyDevices } from '@suite-common/bluetooth';
import {
    Code,
    Column,
    FlexProps,
    Icon,
    InfoSegments,
    Row,
    Text,
    iconSizes,
} from '@trezor/components';
import { models } from '@trezor/connect/src/data/models'; // Todo: solve this import issue
import { DeviceModelInternal } from '@trezor/device-utils';
import { RotateDeviceImage } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { BluetoothDevice } from '@trezor/transport-bluetooth';

import { useSelector } from '../../../hooks/suite';

const TimeAgo = ({ timestamp }: { timestamp: number }) => {
    const [secAgo, setSecAgo] = useState(0);

    useEffect(() => {
        setSecAgo(Math.floor(Date.now() / 1000 - timestamp));
        const interval = setInterval(() => setSecAgo(t => t + 1), 1000);

        return () => clearInterval(interval);
    }, [timestamp]);

    return (
        <>
            <Text variant="warning">{secAgo}</Text>s ago
        </>
    );
};

type BluetoothDeviceProps = {
    device: BluetoothDevice;
    flex?: FlexProps['flex'];
    margin?: FlexProps['margin'];
};

// TODO some config map number => DeviceModelInternal
const getModelEnumFromBytesUtil = (_id: number) => DeviceModelInternal.T3W1;

// TODO some config map number => color id
// discuss final format of it
const getColorEnumFromVariantBytesUtil = (variant: number) => variant;

export const BluetoothDeviceComponent = ({ device, flex, margin }: BluetoothDeviceProps) => {
    console.log('____ BluetoothDeviceComponent :: device', device);

    const model = getModelEnumFromBytesUtil(device.data[2]);
    const color = getColorEnumFromVariantBytesUtil(device.data[1]);
    const colorName = color !== undefined ? models[model].colors[color.toString()] : '';

    // Todo: this is for debug only -----
    const nearbyDevices = useSelector(selectNearbyDevices);
    const isNearbyDevice = nearbyDevices.find(nearbyDevice => nearbyDevice.id === device.id);

    const knownDevices = useSelector(selectKnownDevices);
    const isKnownDevice = knownDevices.find(knownDevice => knownDevice.id === device.id);
    // ----------------------------------

    return (
        <Row gap={spacings.md} alignItems="stretch" flex={flex} margin={margin}>
            <RotateDeviceImage
                deviceModel={model}
                deviceColor={color}
                animationHeight="44px"
                animationWidth="44px"
            />

            <Column justifyContent="start" alignItems="start" flex="1">
                <InfoSegments>
                    <Text typographyStyle="body">Trezor Safe 7</Text>
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
                </InfoSegments>
                <InfoSegments>
                    <Text typographyStyle="hint" variant="purple">
                        <Code>{device.macAddress}</Code>
                    </Text>
                    <TimeAgo timestamp={device.lastUpdatedTimestamp} />
                </InfoSegments>
                <Row>
                    <Text typographyStyle="hint" variant="tertiary">
                        {colorName}
                    </Text>
                    <Icon name="dot" />
                    <Text typographyStyle="hint" variant="tertiary">
                        {device.name}
                    </Text>
                </Row>
            </Column>
        </Row>
    );
};
