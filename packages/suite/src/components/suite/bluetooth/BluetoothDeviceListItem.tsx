import { useCallback } from 'react';

import {
    DeviceBluetoothConnectionStatusType,
    bluetoothActions,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { NewButton, Row } from '@trezor/components';
import { BluetoothDeviceId } from '@trezor/connect';

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
    'pairing-canceled': null, // This shall never be shown to the user
    'pairing-error': null, // This shall never be shown to the user
};

type GhostDeviceActionButtonProps = {
    device: DesktopBluetoothDevice;
    isConnectingDevice: boolean;
    isLoading: boolean;
    onPairAgain?: (deviceId: BluetoothDeviceId) => void;
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
        <NewButton
            size="small"
            isDisabled={isDisabled}
            isLoading={isLoading}
            onClick={handleDelete}
        >
            <Translation id="TR_PAIR_AGAIN" />
        </NewButton>
    );
};

type ActionButtonProps = {
    isGhostDevice: boolean;
    isManuallyPairedDevice: boolean;
    device: DesktopBluetoothDevice;
    onConnect: (deviceId: BluetoothDeviceId) => void;
    onPairAgain?: (deviceId: BluetoothDeviceId) => void;
};

const ActionButton = ({
    isGhostDevice,
    isManuallyPairedDevice,
    device,
    onConnect,
    onPairAgain,
}: ActionButtonProps) => {
    const connectingDevicesIds = useSelector(selectConnectingDevices);

    const isSuiteTryingToConnectToDevice = connectingDevicesIds.includes(device.id);
    const connectionStatus = connectionStatusMap[device.connectionStatus.type];
    const isClickable = connectionStatus?.component === 'button';
    const isLoading = connectionStatus?.component === 'loader';

    const handleOnClick = () => onConnect(device.id);

    if (isGhostDevice) {
        return (
            <GhostDeviceActionButton
                onPairAgain={onPairAgain}
                device={device}
                isLoading={isLoading}
                isConnectingDevice={isSuiteTryingToConnectToDevice}
            />
        );
    }
    if (isManuallyPairedDevice) {
        return (
            <NewButton intent="brand" size="small" onClick={handleOnClick}>
                <Translation id="TR_BLUETOOTH_CONNECT" />
            </NewButton>
        );
    }

    if (isLoading) {
        return <PairingState isLoading text={connectionStatus.text} />;
    }

    if (isClickable) {
        return (
            <NewButton intent="brand" size="small" onClick={handleOnClick}>
                <Translation id={connectionStatus.text} />
            </NewButton>
        );
    }

    return null;
};

type BluetoothDeviceItemProps = {
    device: DesktopBluetoothDevice;
    onConnect: (deviceId: BluetoothDeviceId) => void;
    onPairAgain?: (deviceId: BluetoothDeviceId) => void;
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
    // device manually paired via OS Bluetooth settings, instead of Suite
    const isManuallyPairedDevice = isNearbyDevice && !isKnownDevice;

    return (
        <Row gap={16} justifyContent="space-between">
            <BluetoothDeviceComponent device={device} />
            <ActionButton
                onPairAgain={onPairAgain}
                isGhostDevice={isGhostDevice}
                isManuallyPairedDevice={isManuallyPairedDevice}
                device={device}
                onConnect={onConnect}
            />
        </Row>
    );
};
