import { asBluetoothDeviceId } from '@trezor/connect';
import { createMockDeps } from '@trezor/dependency-injection';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { createBluetoothOnDeviceConnected } from './createBluetoothOnDeviceConnected';
import { mockDesktopBluetoothDevice } from '../mocks/mockDesktopBluetoothDevice';

const knownDevice = (type: 'connected' | 'connecting' | 'disconnected') =>
    mockDesktopBluetoothDevice({
        id: asBluetoothDeviceId('bt-id'),
        connectionStatus: { type },
    });

const usbDevice = { id: 'dev', descriptor: { apiType: 'usb' } } as any;
const btDevice = { id: 'dev', descriptor: { apiType: 'bluetooth' } } as any;

describe('createBluetoothOnDeviceConnected', () => {
    const setup = (known: DesktopBluetoothDevice | undefined) => {
        const disconnectDevice = jest.fn().mockResolvedValue(undefined);
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        const onDeviceConnected = createBluetoothOnDeviceConnected(
            createMockDeps({ getKnownDeviceByDeviceId: () => known, disconnectDevice }),
        );

        return { onDeviceConnected, disconnectDevice };
    };

    afterEach(() => jest.restoreAllMocks());

    it.each(['connected', 'connecting'] as const)(
        'disconnects BT when the same device connects over USB while BT is %s',
        type => {
            const { onDeviceConnected, disconnectDevice } = setup(knownDevice(type));
            onDeviceConnected(usbDevice);
            expect(disconnectDevice).toHaveBeenCalledWith('bt-id');
        },
    );

    it('does nothing when the known BT device is disconnected', () => {
        const { onDeviceConnected, disconnectDevice } = setup(knownDevice('disconnected'));
        onDeviceConnected(usbDevice);
        expect(disconnectDevice).not.toHaveBeenCalled();
    });

    it('does nothing when there is no known BT device', () => {
        const { onDeviceConnected, disconnectDevice } = setup(undefined);
        onDeviceConnected(usbDevice);
        expect(disconnectDevice).not.toHaveBeenCalled();
    });

    it('does nothing when the connected device is itself over bluetooth', () => {
        const { onDeviceConnected, disconnectDevice } = setup(knownDevice('connected'));
        onDeviceConnected(btDevice);
        expect(disconnectDevice).not.toHaveBeenCalled();
    });
});
