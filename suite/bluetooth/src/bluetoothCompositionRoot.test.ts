/**
 * @jest-environment jsdom
 */

import { configureStore, createDynamicMiddleware } from '@reduxjs/toolkit';

import { type BluetoothReducerDeps, bluetoothActions } from '@suite-common/bluetooth';
import { deviceInitialState } from '@suite-common/device';
import { firmwareInitialState } from '@suite-common/firmware';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import {
    type BluetoothCompositionRootDeps,
    createBluetoothCompositionRoot,
} from './bluetoothCompositionRoot';
import { type BluetoothInitRootState } from './createBluetoothInit';
import {
    initialDesktopBluetoothState,
    prepareDesktopBluetoothReducer,
} from './desktopBluetoothReducer';
import { mockDesktopBluetoothDevice } from '../mocks/mockDesktopBluetoothDevice';

describe('createBluetoothCompositionRoot', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(bluetoothIpc, 'init').mockResolvedValue({ success: true });
        jest.spyOn(bluetoothIpc, 'startScan').mockResolvedValue({ success: true });
        jest.spyOn(bluetoothIpc, 'stopScan').mockResolvedValue({ success: true });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it('attaches middleware after store creation and scans using the reduced state', async () => {
        const device = mockDesktopBluetoothDevice({});
        const reducerDeps: BluetoothReducerDeps = {
            actionTypes: { storageLoad: mockActionType('storageLoad') },
        };
        const dynamicMiddleware = createDynamicMiddleware<BluetoothInitRootState>();
        const store = configureStore({
            reducer: {
                bluetooth: prepareDesktopBluetoothReducer(reducerDeps),
                device: (state = deviceInitialState) => state,
                firmware: (state = firmwareInitialState) => state,
            },
            preloadedState: {
                bluetooth: {
                    ...initialDesktopBluetoothState,
                    adapterStatus: 'enabled',
                    knownDevices: [device],
                },
            },
            middleware: getDefaultMiddleware =>
                getDefaultMiddleware().concat(dynamicMiddleware.middleware),
        });
        const getState = jest.spyOn(store, 'getState');
        const deps: BluetoothCompositionRootDeps = {
            getState: store.getState,
            dispatch: store.dispatch,
        };
        const { bluetooth, bluetoothMiddleware } = createBluetoothCompositionRoot(deps);
        dynamicMiddleware.addMiddleware(bluetoothMiddleware);

        expect(getState).not.toHaveBeenCalled();
        expect(bluetoothIpc.init).not.toHaveBeenCalled();
        expect(bluetoothIpc.startScan).not.toHaveBeenCalled();
        expect(bluetooth).not.toHaveProperty('restartBackgroundScanIfNeeded');

        const action = bluetoothActions.updateDeviceConnectionStatus({
            deviceId: device.id,
            connectionStatus: { type: 'disconnected' },
        });

        try {
            expect(store.dispatch(action)).toBe(action);
            expect(bluetoothIpc.startScan).toHaveBeenCalledWith('background');

            store.dispatch(bluetoothActions.adapterEventAction({ status: 'disabled' }));
            await jest.advanceTimersByTimeAsync(12000);

            expect(bluetoothIpc.stopScan).toHaveBeenCalledWith('background');
            expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(1);

            store.dispatch(bluetoothActions.adapterEventAction({ status: 'enabled' }));

            expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(2);
        } finally {
            store.dispatch(bluetoothActions.adapterEventAction({ status: 'disabled' }));
            await jest.advanceTimersByTimeAsync(0);
        }
    });
});
