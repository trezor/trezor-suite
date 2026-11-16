import { type BluetoothAutoConnectPolicy } from '@suite-common/bluetooth';
import { type FirmwareUpdateState } from '@suite-common/firmware';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import { isLinux } from '@trezor/env-utils';
import {
    type BluetoothDevice,
    type BluetoothIpcEvents,
    bluetoothIpc,
} from '@trezor/transport-bluetooth';
import { TypedEmitter } from '@trezor/utils';

import { bluetoothConnectDeviceThunk } from './bluetoothConnectDeviceThunk';
import {
    type SetupBluetoothAutoReconnectDeps,
    createSetupBluetoothAutoReconnect,
} from './createSetupBluetoothAutoReconnect';
import { mockDesktopBluetoothDevice } from '../mocks/mockDesktopBluetoothDevice';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isLinux: jest.fn(),
}));

jest.mock('./bluetoothConnectDeviceThunk', () => ({
    bluetoothConnectDeviceThunk: jest.fn(() => ({ type: 'test/connect-bluetooth' })),
}));

const knownDevice = mockDesktopBluetoothDevice({
    deviceId: 'test-trezor',
    paired: true,
    connectionStatus: { type: 'disconnected' },
});

const deviceUpdate: BluetoothDevice = {
    id: knownDevice.id,
    name: knownDevice.name,
    macAddress: knownDevice.macAddress,
    paired: true,
    connected: false,
    connectionStatus: { type: 'disconnected' },
    lastUpdatedTimestamp: 0,
    data: [1, 0, 6],
};

const firmware: FirmwareUpdateState = {
    status: 'initial',
    error: undefined,
    useDevkit: false,
    firmwareChannel: 'production',
    switchFirmwareType: false,
};

describe('Bluetooth automatic reconnection', () => {
    let devices: TrezorDevice[];
    let autoConnectPolicy: Record<string, BluetoothAutoConnectPolicy | undefined>;
    let events: TypedEmitter<BluetoothIpcEvents>;

    const createDeps = () => {
        const deps = createMockDeps<SetupBluetoothAutoReconnectDeps>({
            getKnownDevices: () => [knownDevice],
            getConnectingDeviceIds: () => [],
            getAdapterStatus: () => 'enabled',
            getAutoConnectPolicy: () => autoConnectPolicy,
            getTrezorDevices: () => devices,
            getFirmware: () => firmware,
            dispatch: null,
            backgroundScan: { start: () => {}, stop: null, restartIfNeeded: null },
        });
        deps.dispatch.mockReturnValue({ type: 'test/dispatched' });

        return deps;
    };

    const startReconnect = async () => {
        const deps = createDeps();
        const ready = createSetupBluetoothAutoReconnect(deps)();
        await jest.advanceTimersByTimeAsync(3000);
        await ready;

        return deps;
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.mocked(isLinux).mockReturnValue(true);
        jest.mocked(bluetoothConnectDeviceThunk).mockClear();
        devices = [mockSuiteDevice({ id: knownDevice.deviceId, connected: false })];
        autoConnectPolicy = {};
        events = new TypedEmitter<BluetoothIpcEvents>();
        jest.spyOn(bluetoothIpc, 'on').mockImplementation(events.on.bind(events));
    });

    afterEach(() => {
        events.removeAllListeners();
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it('reconnects the paired Linux device after USB removal despite a cached pairing flag', async () => {
        devices = [mockSuiteDevice({ id: knownDevice.deviceId, connected: true })];
        const deps = await startReconnect();
        events.emit('device-update', deviceUpdate);
        expect(deps.dispatch).not.toHaveBeenCalled();

        devices = [mockSuiteDevice({ id: knownDevice.deviceId, connected: false })];
        autoConnectPolicy[knownDevice.id] = {
            type: 'recently-disconnected',
            timestamp: Date.now(),
        };
        events.emit('device-update', deviceUpdate);
        await jest.advanceTimersByTimeAsync(0);

        expect(bluetoothConnectDeviceThunk).toHaveBeenCalledWith({ deviceId: knownDevice.id });
        expect(deps.dispatch).toHaveBeenCalledTimes(1);
        expect(deps.dispatch).toHaveBeenCalledWith({ type: 'test/connect-bluetooth' });
    });

    it.each([
        { description: 'an unpaired device', update: { paired: false } },
        { description: 'a device connected elsewhere', update: { data: [5, 0, 6] } },
        { description: 'a manual disconnection on the Trezor', update: { data: [9, 0, 6] } },
        {
            description: 'an active Bluetooth connection',
            update: { connectionStatus: { type: 'connected' } },
        },
    ] satisfies { description: string; update: Partial<BluetoothDevice> }[])(
        'does not reconnect $description while the pairing flag is set',
        async ({ update }) => {
            const deps = await startReconnect();
            events.emit('device-update', { ...deviceUpdate, ...update });
            await jest.advanceTimersByTimeAsync(0);

            expect(deps.dispatch).not.toHaveBeenCalled();
        },
    );

    it('respects disabled automatic reconnection', async () => {
        autoConnectPolicy[knownDevice.id] = { type: 'autoconnect-disabled' };
        const deps = await startReconnect();
        events.emit('device-update', deviceUpdate);
        await jest.advanceTimersByTimeAsync(0);

        expect(deps.dispatch).not.toHaveBeenCalled();
    });

    it('preserves the pairing guard on other operating systems', async () => {
        jest.mocked(isLinux).mockReturnValue(false);
        const deps = await startReconnect();
        events.emit('device-update', deviceUpdate);
        await jest.advanceTimersByTimeAsync(0);

        expect(deps.dispatch).not.toHaveBeenCalled();
    });

    it('still reconnects when the pairing flag is clear', async () => {
        jest.mocked(isLinux).mockReturnValue(false);
        const deps = await startReconnect();
        events.emit('device-update', { ...deviceUpdate, data: [0, 0, 6] });
        await jest.advanceTimersByTimeAsync(0);

        expect(deps.dispatch).toHaveBeenCalledTimes(1);
    });
});
