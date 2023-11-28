import {
    deviceActions,
    prepareDeviceReducer,
    prepareFirmwareReducer,
    firmwareActions,
} from '@suite-common/wallet-core';
import { testMocks } from '@suite-common/test-utils';

import { configureStore, filterThunkActionTypes } from 'src/support/tests/configureStore';
import routerReducer from 'src/reducers/suite/routerReducer';
import modalReducer from 'src/reducers/suite/modalReducer';
import { prepareFirmwareMiddleware } from 'src/middlewares/firmware/firmwareMiddleware';
import { extraDependencies } from 'src/support/extraDependencies';

const { getSuiteDevice } = testMocks;

const firmwareMiddleware = prepareFirmwareMiddleware(extraDependencies);

const middlewares = [firmwareMiddleware];

const deviceReducer = prepareDeviceReducer(extraDependencies);

type FirmwareState = ReturnType<typeof firmwareReducer>;
type RouterState = ReturnType<typeof routerReducer>;
type DeviceState = ReturnType<typeof deviceReducer>;

const firmwareReducer = prepareFirmwareReducer(extraDependencies);

const getInitialState = (
    router?: Partial<RouterState>,
    firmware?: Partial<FirmwareState>,
    device?: Partial<DeviceState>,
) => ({
    firmware: {
        ...firmwareReducer(undefined, {
            type: firmwareActions.resetReducer.type,
            payload: undefined,
        }),
        ...firmware,
    },
    router: {
        ...routerReducer(undefined, { type: 'foo' } as any),
        ...router,
    },
    device: {
        ...deviceReducer(undefined, { type: 'foo' } as any),
        ...device,
    },
    modal: modalReducer(undefined, { type: 'foo' } as any),
    analytics: {
        enabled: false,
    },
});

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, any>([...middlewares]);

    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { firmware, device } = store.getState();
        store.getState().firmware = firmwareReducer(firmware, action);
        store.getState().device = deviceReducer(device, action);

        store.getActions().push(action);
    });
    return store;
};

// do not mock
jest.unmock('@trezor/connect');

jest.doMock('@trezor/suite-analytics', () => testMocks.getAnalytics());
jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('firmware middleware', () => {
    it('if status === "unplug" disconnecting device results in status "reconnect-in-normal"', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'unplug',
                error: undefined,
                firmwareChallenge: '123',
                firmwareHash: '345',
            }),
        );
        await store.dispatch(deviceActions.updateSelectedDevice(undefined));

        const result = filterThunkActionTypes(store.getActions());
        expect(result).toEqual([
            { type: deviceActions.updateSelectedDevice.type, payload: undefined },
            { type: firmwareActions.setStatus.type, payload: 'reconnect-in-normal' },
        ]);
    });

    it('if status === "unplug" disconnecting SAVED device results in status "reconnect-in-normal"', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'unplug',
                error: undefined,
                firmwareChallenge: '123',
                firmwareHash: '345',
            }),
        );
        await store.dispatch({
            type: deviceActions.updateSelectedDevice.type,
            payload: getSuiteDevice({ connected: false }),
        });

        const result = store.getActions();
        expect(result).toEqual([
            {
                type: deviceActions.updateSelectedDevice.type,
                payload: getSuiteDevice({ connected: false }),
            },
            { type: firmwareActions.setStatus.type, payload: 'reconnect-in-normal' },
        ]);
    });

    it('SELECT.DEVICE if in wait-for-reboot -> changes status to "started" if intermediaryInstalled === true', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'wait-for-reboot',
                error: undefined,
                intermediaryInstalled: true,
                firmwareChallenge: '123',
                firmwareHash: '345',
            }),
        );

        await store.dispatch({
            type: deviceActions.selectDevice.type,
            payload: getSuiteDevice({
                mode: 'bootloader',
                connected: true,
            }),
        });

        const result = filterThunkActionTypes(store.getActions());
        expect(result).toEqual([
            {
                type: deviceActions.selectDevice.type,
                payload: getSuiteDevice({ connected: true, mode: 'bootloader' }),
            },
            { type: firmwareActions.setStatus.type, payload: 'started' },
        ]);
    });

    it('SELECT.DEVICE if in wait-for-reboot changes status to "validation" if firmware === valid', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'wait-for-reboot',
                error: undefined,
                firmwareChallenge: '123',
                firmwareHash: '345',
            }),
        );

        await store.dispatch({
            type: deviceActions.selectDevice.type,
            payload: getSuiteDevice({ firmware: 'valid', connected: true }),
        });

        const result = filterThunkActionTypes(store.getActions());

        expect(result).toEqual([
            {
                type: deviceActions.selectDevice.type,
                payload: getSuiteDevice({ firmware: 'valid', connected: true }),
            },
            { type: firmwareActions.setStatus.type, payload: 'validation' },
        ]);
    });

    it('SELECT.DEVICE do nothing if not expected payload (hunting coverage)', async () => {
        const store = initStore(
            getInitialState(undefined, {
                status: 'wait-for-reboot',
                error: undefined,
                firmwareChallenge: '123',
                firmwareHash: '345',
            }),
        );

        await store.dispatch({
            type: deviceActions.selectDevice.type,
            payload: getSuiteDevice({ firmware: 'none' }),
        });
    });

    it('FIRMWARE.SET_UPDATE_STATUS -> FIRMWARE.SET_TARGET_RELEASE', async () => {
        const store = initStore(
            getInitialState(
                undefined,
                {
                    status: 'check-seed',
                    error: undefined,
                    firmwareChallenge: '123',
                    firmwareHash: '345',
                },
                {
                    selectedDevice: getSuiteDevice(),
                },
            ),
        );

        await store.dispatch({
            type: firmwareActions.setStatus.type,
            payload: 'waiting-for-bootloader',
            firmwareChallenge: '123',
            firmwareHash: '345',
        });

        const result = store.getActions();
        result.shift();
        expect(result[0].type).toEqual(firmwareActions.setTargetRelease.type);
    });
});
