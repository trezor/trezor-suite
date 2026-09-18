/**
 * @jest-environment jsdom
 */

import { type UnknownAction, isAction } from '@reduxjs/toolkit';

import { type BluetoothReducerDeps, bluetoothActions } from '@suite-common/bluetooth';
import { deviceInitialState } from '@suite-common/device';
import { firmwareInitialState } from '@suite-common/firmware';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { createBackgroundScan } from './bluetoothBackgroundScan';
import { prepareBluetoothMiddleware } from './bluetoothMiddleware';
import { createBluetoothService } from './bluetoothService';
import {
    type BackgroundScan,
    type BluetoothServiceDeps,
    type BluetoothServiceRootState,
} from './bluetoothServiceTypes';
import {
    initialDesktopBluetoothState,
    prepareDesktopBluetoothReducer,
} from './desktopBluetoothReducer';
import { mockDesktopBluetoothDevice } from '../mocks/mockDesktopBluetoothDevice';

const device = mockDesktopBluetoothDevice({});

describe('prepareBluetoothMiddleware', () => {
    let state: BluetoothServiceRootState;
    let scan: BackgroundScan;
    let dispatch: (action: UnknownAction) => unknown;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(bluetoothIpc, 'startScan').mockResolvedValue({ success: true });
        jest.spyOn(bluetoothIpc, 'stopScan').mockResolvedValue({ success: true });

        state = {
            bluetooth: { ...initialDesktopBluetoothState, knownDevices: [device] },
            device: deviceInitialState,
            firmware: firmwareInitialState,
        };
        const deps: BluetoothServiceDeps = { getState: () => state, dispatch: jest.fn() };
        scan = createBackgroundScan(deps);
        createBluetoothService(deps, {
            backgroundScan: scan,
            firmwareUpdateScan: { start: jest.fn(), stop: jest.fn() },
        });
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
});
