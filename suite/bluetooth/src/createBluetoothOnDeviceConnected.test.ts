import { mockConnectDevice } from '@suite-common/suite-types/mocks';
import { asBluetoothDeviceId } from '@trezor/connect';
import { createMockDeps } from '@trezor/dependency-injection';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import {
    type BluetoothOnDeviceConnectedDeps,
    createBluetoothOnDeviceConnected,
} from './createBluetoothOnDeviceConnected';
import { mockDesktopBluetoothDevice } from '../mocks/mockDesktopBluetoothDevice';

const knownDevice = (type: 'connected' | 'connecting' | 'disconnected') =>
    mockDesktopBluetoothDevice({
        id: asBluetoothDeviceId('bt-id'),
        connectionStatus: { type },
    });

const usbDevice = mockConnectDevice({ id: 'dev', descriptor: { apiType: 'usb', id: 'dev' } });
const otherUsbDevice = mockConnectDevice({
    id: 'other-dev',
    descriptor: { apiType: 'usb', id: 'other-dev' },
});
const btDevice = mockConnectDevice({ id: 'dev', descriptor: { apiType: 'bluetooth', id: 'dev' } });

describe('createBluetoothOnDeviceConnected', () => {
    const setup = (known: DesktopBluetoothDevice | undefined) => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        const deps = createMockDeps<BluetoothOnDeviceConnectedDeps>({
            getKnownDeviceByDeviceId: deviceId => (deviceId === 'dev' ? known : undefined),
            disconnectDevice: () => Promise.resolve(),
        });

        return { onDeviceConnected: createBluetoothOnDeviceConnected(deps), deps };
    };

    afterEach(() => jest.restoreAllMocks());

    it.each(['connected', 'connecting'] as const)(
        'disconnects BT when the same device connects over USB while BT is %s',
        type => {
            const { onDeviceConnected, deps } = setup(knownDevice(type));
            onDeviceConnected(usbDevice);
            expect(deps.getKnownDeviceByDeviceId).toHaveBeenCalledWith('dev');
            expect(deps.disconnectDevice).toHaveBeenCalledWith('bt-id');
        },
    );

    it('does nothing when a different device connects over USB', () => {
        const { onDeviceConnected, deps } = setup(knownDevice('connected'));
        onDeviceConnected(otherUsbDevice);
        expect(deps.getKnownDeviceByDeviceId).toHaveBeenCalledWith('other-dev');
        expect(deps.disconnectDevice).not.toHaveBeenCalled();
    });

    it('does nothing when the known BT device is disconnected', () => {
        const { onDeviceConnected, deps } = setup(knownDevice('disconnected'));
        onDeviceConnected(usbDevice);
        expect(deps.disconnectDevice).not.toHaveBeenCalled();
    });

    it('does nothing when there is no known BT device', () => {
        const { onDeviceConnected, deps } = setup(undefined);
        onDeviceConnected(usbDevice);
        expect(deps.disconnectDevice).not.toHaveBeenCalled();
    });

    it('does nothing when the connected device is itself over bluetooth', () => {
        const { onDeviceConnected, deps } = setup(knownDevice('connected'));
        onDeviceConnected(btDevice);
        expect(deps.disconnectDevice).not.toHaveBeenCalled();
    });
});
