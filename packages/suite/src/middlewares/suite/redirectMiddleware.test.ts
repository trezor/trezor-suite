import { type Middleware, type UnknownAction } from '@reduxjs/toolkit';

import { type DebugRootState, debugInitialState } from '@suite/debug';
import { type LocksRootState, locksInitialState, locksReducer } from '@suite/locks';
import { type State as ModalReducerState, type ModalRootState, modalReducer } from '@suite/modal';
import {
    type GotoThunkDeps,
    type RouterRootState,
    onLocationChangeThunk,
    routerLocationChange,
    routerReducer,
} from '@suite/router';
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
import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { DEVICE } from '@trezor/connect';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import redirectMiddleware from '#src/middlewares/suite/redirectMiddleware';
import { prepareSuiteMiddleware } from '#src/middlewares/suite/suiteMiddleware';
import suiteReducer, {
    type SuiteRootState,
    type SuiteState,
} from '#src/reducers/suite/suiteReducer';

jest.mock('#src/actions/suite/storageActions', () => ({ __esModule: true }));
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
    DebugRootState &
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
    isDebugModeActive = false,
): State => ({
    debug: { ...debugInitialState, showDebugMenu: isDebugModeActive },
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

const initStore = (state: State, downstreamMiddleware: Middleware[] = []) =>
    createTestCompositionRoot<GotoThunkDeps, State>({
        middleware: [...middlewares, ...downstreamMiddleware],
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
        services: () => ({ suiteRouterHistory: mockSuiteRouterHistory() }),
    }).services.store;

describe('redirectMiddleware', () => {
    describe('redirects on DEVICE.CONNECT event', () => {
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

    describe('debug-only routes', () => {
        const watchLocation = { pathname: '/watch', hash: '#/eth/0xWatchedAddress' } as const;

        it('lands on the dashboard without the watch params when debug mode is off', () => {
            // Stands in for the analytics, router and Sentry middlewares that run after it.
            const downstreamActions: UnknownAction[] = [];
            const recordDownstream: Middleware = () => next => action => {
                downstreamActions.push(action as UnknownAction);

                return next(action);
            };
            const store = initStore(getInitialState(), [recordDownstream]);

            store.dispatch(onLocationChangeThunk(watchLocation));

            const { router } = store.getState();
            expect(router.route?.name).toBe('suite-index');
            expect(router.pathname).toBe('/');
            expect(router.hash).toBe('');
            expect(router.params).toBeUndefined();
            const downstreamLocationChanges = downstreamActions.filter(action =>
                routerLocationChange.match(action),
            );
            expect(downstreamLocationChanges).toEqual([
                expect.objectContaining({
                    payload: expect.objectContaining({ pathname: '/', hash: '' }),
                }),
            ]);
            expect(JSON.stringify(downstreamLocationChanges)).not.toContain('0xWatchedAddress');
        });

        it('opens the watch route when debug mode is on', () => {
            const store = initStore(
                getInitialState(undefined, undefined, undefined, undefined, true),
            );

            store.dispatch(onLocationChangeThunk(watchLocation));

            const { router } = store.getState();
            expect(router.route?.name).toBe('suite-watch-account');
            expect(router.params).toEqual({ symbol: 'eth', address: '0xWatchedAddress' });
        });
    });
});
