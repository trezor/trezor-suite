import { useState } from 'react';

import {
    DeviceBluetoothConnectionStatusType,
    bluetoothActions,
    selectConnectingDevices,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { Banner, Button, Column, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';
import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';
import { useDispatch, useSelector } from '../../../hooks/suite';
import { Translation, TranslationKey } from '../Translation';

const labelMap: Record<DeviceBluetoothConnectionStatusType, TranslationKey | null> = {
    disconnected: 'TR_BLUETOOTH_CONNECT',
    connecting: 'TR_BLUETOOTH_CONNECTING',
    connected: null, // Do not offer disconnect, it is confusing to the user as BT device auto-connects anyway.
    'connection-error': 'TR_BLUETOOTH_TRY_AGAIN', // Out-of-range, offline, in the faraday cage, ...
    pairing: 'TR_BLUETOOTH_PAIRING',
    paired: 'TR_BLUETOOTH_PAIRED',
    'pairing-error': null, // This shall never be shown to the user
};

const LOADING_STATUSES: DeviceBluetoothConnectionStatusType[] = ['pairing', 'connecting'];
const DISABLED_STATUSES: DeviceBluetoothConnectionStatusType[] = ['pairing', 'connecting'];

type BluetoothDeviceItemProps = {
    device: DesktopBluetoothDevice;
    onConnect: (deviceId: string) => Promise<void>;
};

export const BluetoothDeviceListItem = ({ device, onConnect }: BluetoothDeviceItemProps) => {
    const dispatch = useDispatch();

    const nearbyDevices = useSelector(selectNearbyDevices);
    const isNearbyDevice = (nearbyDevices ?? []).find(
        nearbyDevice => nearbyDevice.id === device.id,
    );
    const knownDevices = useSelector(selectKnownDevices);
    const isKnownDevice = knownDevices.find(knownDevice => knownDevice.id === device.id);

    const connectingDevicesIds = useSelector(selectConnectingDevices);
    const isConnectingDevice = connectingDevicesIds.includes(device.id);

    const [isLoading, setIsLoading] = useState(false);

    const isDisabled =
        DISABLED_STATUSES.includes(device.connectionStatus.type) || isConnectingDevice;

    const isGlobalLoading = LOADING_STATUSES.includes(device.connectionStatus.type);

    const onClickMap: Record<
        DeviceBluetoothConnectionStatusType,
        (() => Promise<void>) | undefined
    > = {
        'connection-error': () => onConnect(device.id),
        'pairing-error': undefined,
        connected: undefined,
        connecting: undefined,
        disconnected: () => onConnect(device.id),
        paired: undefined,
        pairing: undefined,
    };

    const handleOnclick = onClickMap[device.connectionStatus.type];

    const handleOnClick = async () => {
        setIsLoading(true);
        await handleOnclick?.();
        setIsLoading(false);
    };

    const handleDelete = () => {
        dispatch(bluetoothActions.removeKnownDeviceAction({ id: device.id }));
    };

    const buttonLabel = labelMap[isConnectingDevice ? 'connecting' : device.connectionStatus.type];

    const isGhostDevice = isKnownDevice && !isNearbyDevice;

    return (
        <>
            <Column gap={spacings.xs}>
                <Row gap={spacings.md} alignItems="center">
                    <BluetoothDeviceComponent device={device} flex="1" />
                    {buttonLabel !== null ? (
                        <Row gap={spacings.xs}>
                            {isGhostDevice ? (
                                <Button
                                    variant="warning"
                                    size="small"
                                    margin={{ vertical: spacings.xxs }}
                                    isDisabled={isDisabled || handleOnclick === undefined}
                                    isLoading={isLoading || isGlobalLoading}
                                    onClick={handleDelete}
                                >
                                    <Translation id="TR_REMOVE" />
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    size="small"
                                    margin={{ vertical: spacings.xxs }}
                                    isDisabled={isDisabled || handleOnclick === undefined}
                                    isLoading={isLoading || isGlobalLoading}
                                    onClick={handleOnClick}
                                >
                                    <Translation id={buttonLabel} />
                                </Button>
                            )}
                        </Row>
                    ) : null}
                </Row>
                {isGhostDevice && (
                    <Banner variant="warning">
                        <Translation id="TR_BLUETOOTH_GHOST_DEVICE" />
                    </Banner>
                )}
            </Column>
        </>
    );
};
