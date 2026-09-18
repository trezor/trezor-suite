/**
 * @jest-environment jsdom
 */

import { type UnknownAction, isAction } from '@reduxjs/toolkit';

import { type BluetoothReducerDeps, bluetoothActions } from '@suite-common/bluetooth';
import { deviceActions, deviceInitialState } from '@suite-common/device';
import { firmwareActions, firmwareInitialState, firmwareUpdateThunk } from '@suite-common/firmware';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import {
    type Device,
    UI_EVENTS,
    type UiEventFirmwareDisconnect,
    asDeviceUniquePath,
} from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { createBackgroundScan } from './bluetoothBackgroundScan';
import { prepareBluetoothMiddleware } from './bluetoothMiddleware';
import { createBluetoothService } from './bluetoothService';
import {
    type BackgroundScan,
    type BluetoothServiceDeps,
    type BluetoothServiceRootState,
    type FirmwareUpdateScan,
} from './bluetoothServiceTypes';
import {
    initialDesktopBluetoothState,
    prepareDesktopBluetoothReducer,
} from './desktopBluetoothReducer';
import { mockDesktopBluetoothDevice } from '../mocks/mockDesktopBluetoothDevice';

const device = mockDesktopBluetoothDevice({});
const disconnectedDevice = mockDesktopBluetoothDevice({
    connectionStatus: { type: 'disconnected' },
});

const connectDevice = {
    type: 'unacquired',
    path: asDeviceUniquePath('test-path'),
    name: 'Test device',
    label: 'Unacquired device',
    descriptor: { apiType: 'bluetooth', id: device.id },
} satisfies Device;

const suiteDevice: Parameters<typeof deviceActions.deviceDisconnect>[0] = {
    ...connectDevice,
    connected: false,
    available: false,
    ts: 0,
    firstConnectedTimestamp: 0,
    buttonRequests: [],
    metadata: {},
    passwords: {},
};

const firmwareDisconnect = (descriptor: Device['descriptor']) =>
    ({
        type: UI_EVENTS.FIRMWARE_DISCONNECT,
        payload: { device: { ...connectDevice, descriptor } },
    }) satisfies UiEventFirmwareDisconnect;

describe('prepareBluetoothMiddleware', () => {
    let state: BluetoothServiceRootState;
    let scan: BackgroundScan;
    let firmwareUpdateScan: jest.Mocked<FirmwareUpdateScan>;
    let dispatch: (action: UnknownAction) => unknown;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(bluetoothIpc, 'startScan').mockResolvedValue({ success: true });
        jest.spyOn(bluetoothIpc, 'stopScan').mockResolvedValue({ success: true });
        jest.spyOn(document, 'addEventListener');

        state = {
            bluetooth: { ...initialDesktopBluetoothState, knownDevices: [device] },
            device: deviceInitialState,
            firmware: firmwareInitialState,
        };
        const deps: BluetoothServiceDeps = { getState: () => state, dispatch: jest.fn() };
        scan = createBackgroundScan(deps);
        firmwareUpdateScan = { start: jest.fn(), stop: jest.fn() };
        createBluetoothService(deps, { backgroundScan: scan, firmwareUpdateScan });
        const reducerDeps: BluetoothReducerDeps = {
            actionTypes: { storageLoad: mockActionType('storageLoad') },
        };
        const reducer = prepareDesktopBluetoothReducer(reducerDeps);
        const next = (action: unknown) => {
            if (!isAction(action)) {
                throw new Error('Expected a Redux action.');
            }

            state = { ...state, bluetooth: reducer(state.bluetooth, action) };

            return action;
        };
        dispatch = prepareBluetoothMiddleware(() => ({}))(deps)(next);
    });

    afterEach(async () => {
        scan.stop();
        await jest.advanceTimersByTimeAsync(0);
        for (const [event, listener] of jest.mocked(document.addEventListener).mock.calls) {
            if (event === 'visibilitychange') {
                document.removeEventListener(event, listener);
            }
        }
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it.each([
        bluetoothActions.deviceUpdateAction({
            device: { ...device, connectionStatus: { type: 'disconnected' } },
        }),
        bluetoothActions.updateDeviceConnectionStatus({
            deviceId: device.id,
            connectionStatus: { type: 'disconnected' },
        }),
        bluetoothActions.knownDevicesUpdateAction({
            knownDevices: [{ ...device, connectionStatus: { type: 'disconnected' } }],
        }),
    ])('starts scanning after reducing $type and preserves the dispatch result', async action => {
        expect(dispatch(action)).toBe(action);
        await jest.advanceTimersByTimeAsync(0);

        expect(bluetoothIpc.startScan).toHaveBeenCalledWith('background');
    });

    it('starts scanning when a Connect device disconnects while a known device is unreachable', async () => {
        state.bluetooth.knownDevices = [disconnectedDevice];

        dispatch(deviceActions.deviceDisconnect(suiteDevice));
        await jest.advanceTimersByTimeAsync(0);

        expect(bluetoothIpc.startScan).toHaveBeenCalledWith('background');
    });

    it('does not start scanning on an action that cannot change device reachability', async () => {
        state.bluetooth.knownDevices = [disconnectedDevice];

        dispatch(bluetoothActions.scanStatusAction({ status: 'running' }));
        await jest.advanceTimersByTimeAsync(0);

        expect(bluetoothIpc.startScan).not.toHaveBeenCalled();
    });

    it('stops scanning as soon as the last disconnected device becomes connected', async () => {
        state.bluetooth.knownDevices = [{ ...device, connectionStatus: { type: 'disconnected' } }];
        scan.start();
        await jest.advanceTimersByTimeAsync(0);

        dispatch(bluetoothActions.deviceUpdateAction({ device }));
        await jest.advanceTimersByTimeAsync(0);

        expect(bluetoothIpc.stopScan).toHaveBeenCalledWith('background');
        await jest.advanceTimersByTimeAsync(12000);
        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);
    });

    describe('firmware-update scan', () => {
        it('starts for the Bluetooth device that is about to reboot', () => {
            dispatch(firmwareDisconnect({ apiType: 'bluetooth', id: device.id }));

            expect(firmwareUpdateScan.start).toHaveBeenCalledTimes(1);
            expect(firmwareUpdateScan.start).toHaveBeenCalledWith(device.id);
        });

        it.each<Device['descriptor']>([
            { apiType: 'usb', id: device.id },
            { apiType: 'bluetooth' },
        ])('does not start for descriptor %j', descriptor => {
            dispatch(firmwareDisconnect(descriptor));

            expect(firmwareUpdateScan.start).not.toHaveBeenCalled();
        });

        it.each<[string, UnknownAction]>([
            ['the reducer is reset', firmwareActions.resetReducer()],
            ['the update is done', firmwareActions.setStatus('done')],
            ['the update fails', firmwareActions.setStatus('error')],
            ['an update error is set', firmwareActions.setFirmwareUpdateError('update failed')],
            ['the update thunk is rejected', { type: firmwareUpdateThunk.rejected.type }],
            ['the update thunk is fulfilled', { type: firmwareUpdateThunk.fulfilled.type }],
        ])('stops when %s', (_, action) => {
            dispatch(action);

            expect(firmwareUpdateScan.stop).toHaveBeenCalledTimes(1);
        });

        // The device reboots during these, so stopping here would end the scan before it reconnects.
        it.each<[string, UnknownAction]>([
            ['the update starts', firmwareActions.setStatus('started')],
            ['THP pairing is pending', firmwareActions.setStatus('thp-pairing')],
            ['the update error is cleared', firmwareActions.setFirmwareUpdateError(undefined)],
        ])('keeps running when %s', (_, action) => {
            dispatch(action);

            expect(firmwareUpdateScan.stop).not.toHaveBeenCalled();
        });
    });
});
