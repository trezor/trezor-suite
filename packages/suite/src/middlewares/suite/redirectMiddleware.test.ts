import { type UnknownAction } from '@reduxjs/toolkit';

import { type LocksRootState, locksInitialState, locksReducer } from '@suite/locks';
import { type State as ModalReducerState, type ModalRootState, modalReducer } from '@suite/modal';
import { type RouterRootState, routerReducer } from '@suite/router';
import {
    type RouterStateOverrides,
    createRouterStateMock,
    mockSuiteRouterHistory,
} from '@suite/router/mocks';
import {
    type DeviceReducerState,
    type DeviceRootState,
    deviceActions,
    prepareDeviceReducer,
} from '@suite-common/device';
import {
    type MessageSystemRootState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { DEVICE } from '@trezor/connect';

import redirectMiddleware from 'src/middlewares/suite/redirectMiddleware';
import { prepareSuiteMiddleware } from 'src/middlewares/suite/suiteMiddleware';
import suiteReducer, {
    type SuiteRootState,
    type SuiteState,
} from 'src/reducers/suite/suiteReducer';

jest.mock('src/actions/suite/storageActions', () => ({ __esModule: true }));
const deviceReducer = prepareDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});

type State = SuiteRootState &
    DeviceRootState &
    LocksRootState &
    RouterRootState &
    ModalRootState &
    MessageSystemRootState;

const getInitialState = (
    suite?: Partial<SuiteState>,
    device?: Partial<DeviceReducerState>,
    router?: RouterStateOverrides,
    modal?: ModalReducerState,
): State => ({
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
    locks: locksInitialState,
    device: {
        ...deviceReducer(undefined, { type: 'foo' } as any),
        ...device,
    },
    router: createRouterStateMock(router),
    modal: modal ?? modalReducer(undefined, { type: 'foo' }),
    messageSystem: messageSystemInitialState,
});

const middlewares = [
    redirectMiddleware,
    prepareSuiteMiddleware(() => ({ services: { suiteSync: mockSuiteSync() } })),
];

const initStore = (state: State) => {
    const extra = { services: { suiteRouterHistory: mockSuiteRouterHistory() } };
    const store = createTestStore<typeof extra, State, UnknownAction>({
        extra,
        middleware: middlewares,
        reducer: (currentState = state, action: UnknownAction) => {
            const typedState = currentState as State;

            return {
                ...typedState,
                suite: suiteReducer(typedState.suite, action),
                router: routerReducer(typedState.router, action),
                device: deviceReducer(typedState.device, action),
                locks: locksReducer(typedState.locks, action),
            };
        },
        preloadedState: state,
    });

    return store;
};

describe('redirectMiddleware', () => {
    describe('redirects on DEVICE.CONNECT event', () => {
        it('DEVICE.CONNECT mode=initialize', () => {
            const store = initStore(getInitialState());

            const connectDevice = mockConnectDevice({ mode: 'initialize' });
            store.dispatch({ type: DEVICE.CONNECT, payload: { device: connectDevice } });

            const device = store.getState().device.devices.find(d => d.id === connectDevice.id);
            store.dispatch({ type: deviceActions.selectDevice.type, payload: device });

            expect(store.getState().router.route?.name).toBe('suite-start');
        });

        it('DEVICE.CONNECT firmware=required', () => {
            const store = initStore(getInitialState());

            const connectDevice = mockConnectDevice({ mode: 'normal', firmware: 'required' });
            store.dispatch({ type: DEVICE.CONNECT, payload: { device: connectDevice } });

            const device = store.getState().device.devices.find(d => d.id === connectDevice.id);
            store.dispatch({ type: deviceActions.selectDevice.type, payload: device });

            expect(store.getState().router.route?.name).toBe('firmware-index');
        });

        it('SUITE.SELECT_DEVICE reset wallet params', () => {
            const store = initStore(
                getInitialState(
                    undefined,
                    {
                        devices: [],
                        selectedDevice: mockSuiteDevice(
                            {
                                path: '2',
                            },
                            {
                                device_id: 'previous-device',
                            },
                        ),
                    },
                    {
                        app: 'wallet',
                        params: {
                            symbol: 'btc',
                            accountIndex: 2,
                            accountType: 'normal',
                        },
                        route: {
                            name: 'wallet-index',
                            pattern: '/accounts',
                            app: 'wallet',
                            params: ['symbol', 'accountIndex', 'accountType'],
                            isForegroundApp: undefined,
                            isFullscreenApp: undefined,
                            isNestedRoute: undefined,
                            clearUrl: undefined,
                            hasNestedRoutes: undefined,
                        },
                    },
                ),
            );
            store.dispatch({
                type: deviceActions.selectDevice.type,
                payload: mockSuiteDevice(),
            });
            expect(store.getState().router.route?.name).toBe('wallet-index');
        });
    });
});
