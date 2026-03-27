import { useRef } from 'react';

import { selectKnownDeviceByDeviceId } from '@suite-common/bluetooth/src/bluetoothSelectors';
import { selectPersistentDeviceDataById, selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getIsDeviceConnectedViaBluetooth, getIsThpDevice } from '@suite-common/suite-utils';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';

import {
    ConnectedCableForgetFlow,
    ImmediateForgetFlow,
    ThpBtConnectedForgetFlow,
    ThpBtKnownForgetFlow,
    ThpCableConnectedForgetFlow,
} from './ForgetDeviceFlows';

/**
 * Resolved device state for the forget/unpair flow.
 *
 * - `non-thp-connected`: Legacy device connected via cable — forget + prompt to unplug.
 * - `non-thp-disconnected`: Legacy device not connected — forget immediately.
 * - `thp-cable-connected`: THP device connected via USB cable — forget + OS/Trezor cleanup.
 * - `thp-bt-connected`: THP device connected via Bluetooth — bleUnpair, then OS removal.
 * - `thp-bt-known`: THP device not connected, but has BT credentials — OS + Trezor removal steps.
 * - `thp-disconnected`: THP device not connected and no BT credentials — forget immediately.
 */
type ForgetDeviceState =
    | 'non-thp-connected'
    | 'non-thp-disconnected'
    | 'thp-cable-connected'
    | 'thp-bt-connected'
    | 'thp-bt-known'
    | 'thp-disconnected';

const resolveForgetDeviceState = (
    device: TrezorDevice,
    { hasBluetoothCredentials }: { hasBluetoothCredentials: boolean },
): ForgetDeviceState => {
    const isThp = getIsThpDevice(device);

    if (!isThp) {
        return device.connected ? 'non-thp-connected' : 'non-thp-disconnected';
    }

    if (getIsDeviceConnectedViaBluetooth(device)) {
        return 'thp-bt-connected';
    }

    if (device.connected) {
        return hasBluetoothCredentials ? 'thp-cable-connected' : 'non-thp-connected';
    }

    if (hasBluetoothCredentials) {
        return 'thp-bt-known';
    }

    return 'thp-disconnected';
};

export const ForgetDeviceModal = ({ onCancel }: { onCancel: () => void }) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const persistentData = useSelector(state =>
        selectPersistentDeviceDataById(state, selectedDevice?.id),
    );

    const knownBluetoothDevice = useSelector(state =>
        selectKnownDeviceByDeviceId(state, selectedDevice?.id ?? undefined),
    );
    const hasBluetoothCredentials =
        persistentData?.lastConnectedVia === 'bluetooth' || !!knownBluetoothDevice;

    // Capture the device state once on mount so that mid-flow device changes
    // (e.g. BT disconnect after bleUnpair) don't swap out the flow component.
    const initialDeviceStateRef = useRef<ForgetDeviceState | null>(null);

    if (!selectedDevice) {
        return null;
    }

    if (initialDeviceStateRef.current === null) {
        initialDeviceStateRef.current = resolveForgetDeviceState(selectedDevice, {
            hasBluetoothCredentials,
        });
    }

    const deviceState = initialDeviceStateRef.current;

    switch (deviceState) {
        case 'non-thp-connected':
            return <ConnectedCableForgetFlow onCancel={onCancel} isBluetoothDevice={false} />;

        case 'non-thp-disconnected':
        case 'thp-disconnected':
            return <ImmediateForgetFlow onCancel={onCancel} />;

        case 'thp-bt-connected':
            return <ThpBtConnectedForgetFlow onCancel={onCancel} />;

        case 'thp-cable-connected':
            return <ThpCableConnectedForgetFlow onCancel={onCancel} />;

        case 'thp-bt-known':
            return <ThpBtKnownForgetFlow onCancel={onCancel} />;

        default:
            return exhaustive(deviceState);
    }
};
