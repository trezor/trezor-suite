import { type UnknownAction } from '@reduxjs/toolkit';

import { createMockDeps } from '@suite-common/dependency-injection';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { UI_EVENTS } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { prepareBluetoothMiddleware } from './bluetoothMiddleware';

jest.mock('@trezor/transport-bluetooth', () => ({
    bluetoothIpc: {
        disconnectDevice: jest.fn().mockResolvedValue(undefined),
        startScan: jest.fn().mockResolvedValue(undefined),
    },
}));

const device = mockSuiteDevice({ descriptor: { apiType: 'bluetooth', id: 'bluetooth-device' } });

const createStore = () => {
    const extra = createMockDeps({
        services: {},
    });
    const store = createTestStore({
        extra,
        middleware: [prepareBluetoothMiddleware(() => extra)],
        reducer: (_state = '', action: UnknownAction) => action.type,
    });

    return { store };
};

describe(prepareBluetoothMiddleware.name, () => {
    it('restarts scanning on UI_EVENTS.FIRMWARE_DISCONNECT', async () => {
        const { store } = createStore();
        store.dispatch({
            type: UI_EVENTS.FIRMWARE_DISCONNECT,
            payload: { device },
        });
        store.dispatch({
            type: UI_EVENTS.FIRMWARE_DISCONNECT,
            payload: { device },
        });
        store.dispatch({
            type: UI_EVENTS.FIRMWARE_DISCONNECT,
            payload: { device },
        });

        await Promise.resolve();

        expect(bluetoothIpc.startScan).toHaveBeenCalledTimes(3);
    });
});
