import { useCallback } from 'react';

import {
    DeviceBluetoothConnectionStatusType,
    bluetoothActions,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { Button, Column, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';
import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';
import { selectConnectingDevices } from '../../../actions/bluetooth/desktopBluetoothSelectors';
import { useDispatch, useSelector } from '../../../hooks/suite';
import { Translation, TranslationKey } from '../Translation';
import { PairingState } from './PairingState';

const connectionStatusMap: Record<
    DeviceBluetoothConnectionStatusType,
    { component: 'button' | 'loader'; text: TranslationKey } | null
> = {
    disconnected: { component: 'button', text: 'TR_BLUETOOTH_CONNECT' },
    connecting: { component: 'loader', text: 'TR_BLUETOOTH_CONNECTING' },
    connected: null, // Do not offer disconnect, it is confusing to the user as BT device auto-connects anyway.
    'connection-error': { component: 'button', text: 'TR_BLUETOOTH_TRY_AGAIN' }, // Out-of-range, offline, in the faraday cage, ...
    pairing: { component: 'loader', text: 'TR_BLUETOOTH_PAIRING' },
    paired: null, // This shall never be shown to the user
    'pairing-error': null, // This shall never be shown to the user
};

type GhostDeviceActionButtonProps = {
    device: DesktopBluetoothDevice;
    isConnectingDevice: boolean;
    isLoading: boolean;
    onPairAgain?: (deviceId: string) => Promise<void>;
};

const GhostDeviceActionButton = ({
    device,
    isLoading,
    isConnectingDevice,
    onPairAgain,
}: GhostDeviceActionButtonProps) => {
    const dispatch = useDispatch();

    const handleDelete = useCallback(() => {
        dispatch(bluetoothActions.removeKnownDeviceAction({ id: device.id }));
        onPairAgain?.(device.id);
    }, [dispatch, device.id, onPairAgain]);

    const isDisabled = isLoading || isConnectingDevice;

    return (
        <Button
            size="small"
            margin={{ vertical: spacings.xxs }}
            isDisabled={isDisabled}
            isLoading={isLoading}
            onClick={handleDelete}
        >
            <Translation id="TR_PAIR_AGAIN" />
        </Button>
    );
};

type ActionButtonProps = {
    isGhostDevice: boolean;
    device: DesktopBluetoothDevice;
    onConnect: (deviceId: string) => Promise<void>;
    onPairAgain?: (deviceId: string) => Promise<void>;
};

const ActionButton = ({ isGhostDevice, device, onConnect, onPairAgain }: ActionButtonProps) => {
    const connectingDevicesIds = useSelector(selectConnectingDevices);

    const isSuiteTryingToConnectToDevice = connectingDevicesIds.includes(device.id);
    const connectionStatus = connectionStatusMap[device.connectionStatus.type];
    const isClickable = connectionStatus?.component === 'button';
    const isLoading = connectionStatus?.component === 'loader';

    if (isGhostDevice) {
        return (
            <Row gap={spacings.xs}>
                <GhostDeviceActionButton
                    onPairAgain={onPairAgain}
                    device={device}
                    isLoading={isLoading}
                    isConnectingDevice={isSuiteTryingToConnectToDevice}
                />
            </Row>
        );
    }

    const handleOnClick = () => onConnect(device.id);

    return (
        <Row gap={spacings.xs}>
            {isClickable && (
                <Button
                    variant="primary"
                    size="small"
                    margin={{ vertical: spacings.xxs }}
                    onClick={handleOnClick}
                >
                    <Translation id={connectionStatus.text} />
                </Button>
            )}
            {isLoading && <PairingState isLoading text={connectionStatus.text} />}
        </Row>
    );
};

type BluetoothDeviceItemProps = {
    device: DesktopBluetoothDevice;
    onConnect: (deviceId: string) => Promise<void>;
    onPairAgain?: (deviceId: string) => Promise<void>;
};

export const BluetoothDeviceListItem = ({
    device,
    onConnect,
    onPairAgain,
}: BluetoothDeviceItemProps) => {
    const nearbyDevices = useSelector(selectNearbyDevices);
    const isNearbyDevice = (nearbyDevices ?? []).some(
        nearbyDevice => nearbyDevice.id === device.id,
    );
    const knownDevices = useSelector(selectKnownDevices);
    const isKnownDevice = knownDevices.some(knownDevice => knownDevice.id === device.id);

    const isGhostDevice = isKnownDevice && !isNearbyDevice;

    return (
        <>
            <Column gap={spacings.xs}>
                <Row gap={spacings.md} alignItems="center">
                    <BluetoothDeviceComponent device={device} flex="1" />

                    <ActionButton
                        onPairAgain={onPairAgain}
                        isGhostDevice={isGhostDevice}
                        device={device}
                        onConnect={onConnect}
                    />
                </Row>
            </Column>
        </>
    );
};
