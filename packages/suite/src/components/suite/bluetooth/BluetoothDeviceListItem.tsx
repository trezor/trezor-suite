import { useCallback } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { events } from '@suite-common/analytics';
import {
    type DeviceBluetoothConnectionStatusType,
    bluetoothActions,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { Button, Row } from '@trezor/components';
import { type BluetoothDeviceId } from '@trezor/connect';

import { type DesktopBluetoothDevice } from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { selectConnectingDevices } from 'src/actions/bluetooth/desktopBluetoothSelectors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { BluetoothDeviceComponent } from './BluetoothDeviceComponent';
import { PairingState } from './PairingState';
import { useConnectionGlobalModalContext } from '../../connection/context/ConnectionGlobalModalContext';

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
        <Button size="small" isDisabled={isDisabled} isLoading={isLoading} onClick={handleDelete}>
            <Translation id="TR_PAIR_AGAIN" />
        </Button>
    );
};

type ActionButtonProps = {
    isGhostDevice: boolean;
    isManuallyPairedDevice: boolean;
    device: DesktopBluetoothDevice;
    onPairAgain?: (deviceId: BluetoothDeviceId) => void;
};

const ActionButton = ({
    isGhostDevice,
    isManuallyPairedDevice,
    device,
    onPairAgain,
}: ActionButtonProps) => {
    const connectingDevicesIds = useSelector(selectConnectingDevices);
    const { onConnect } = useConnectionGlobalModalContext();
    const analytics = useAnalytics();
    const isSuiteTryingToConnectToDevice = connectingDevicesIds.includes(device.id);
    const connectionStatus = connectionStatusMap[device.connectionStatus.type];
    const isClickable = connectionStatus?.component === 'button';
    const isLoading = connectionStatus?.component === 'loader';

    const handleOnClick = () => {
        analytics.report({
            type: events.deviceConnectionDeviceFoundEvent.name,
            payload: {
                option: 'connect',
            },
        });
        onConnect(device.id);
    };

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
            <Button intent="brand" size="small" onClick={handleOnClick}>
                <Translation id="TR_BLUETOOTH_CONNECT" />
            </Button>
        );
    }

    if (isLoading) {
        return <PairingState isLoading text={connectionStatus.text} />;
    }

    if (isClickable) {
        return (
            <Button intent="brand" size="small" onClick={handleOnClick}>
                <Translation id={connectionStatus.text} />
            </Button>
        );
    }

    return null;
};

type BluetoothDeviceItemProps = {
    device: DesktopBluetoothDevice;
    onPairAgain?: (deviceId: BluetoothDeviceId) => void;
};

export const BluetoothDeviceListItem = ({ device, onPairAgain }: BluetoothDeviceItemProps) => {
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
            />
        </Row>
    );
};
