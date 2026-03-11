import type { UnknownAction } from '@reduxjs/toolkit';

import { locksInitialState, locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { routerAppChanged, routerReducer } from '@suite/router';
import { deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { DEVICE } from '@trezor/connect';

import * as routerActions from 'src/actions/suite/routerActions';
import redirectMiddleware from 'src/middlewares/suite/redirectMiddleware';
import { prepareSuiteMiddleware } from 'src/middlewares/suite/suiteMiddleware';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { extraDependencies } from 'src/support/extraDependencies';
import { configureStore } from 'src/support/tests/configureStore';
import { Action } from 'src/types/suite';

jest.mock('src/actions/suite/storageActions', () => ({ __esModule: true }));

const deviceReducer = prepareDeviceReducer(extraDependencies);

type SuiteState = ReturnType<typeof suiteReducer>;
type DevicesState = ReturnType<typeof deviceReducer>;
type RouterState = ReturnType<typeof routerReducer>;
type ModalState = ReturnType<typeof modalReducer>;

const getInitialState = (
    suite?: Partial<SuiteState>,
    device?: Partial<DevicesState>,
    router?: Partial<RouterState>,
    modal?: Partial<ModalState>,
) => ({
    suite: {
        ...suiteReducer(undefined, routerAppChanged('unknown')),
        ...suite,
    },
    locks: locksInitialState,
    device: {
        ...deviceReducer(undefined, routerAppChanged('unknown')),
        ...device,
    },
    router: {
        ...routerReducer(undefined, routerAppChanged('unknown')),
        ...router,
    },
    modal: {
        ...modalReducer(undefined, routerAppChanged('unknown')),
        ...modal,
    },
    messageSystem: {},
});

type State = ReturnType<typeof getInitialState>;
const middlewares = [redirectMiddleware, prepareSuiteMiddleware(() => extraDependenciesCommonMock)];

const initStore = (state: State) => {
    const mockStore = configureStore<State, Action>(middlewares);
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        if (!action) {
            return;
        }

        const { suite, router, device, locks } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().router = routerReducer(router as RouterState, action as UnknownAction);
        store.getState().device = deviceReducer(device, action);
        store.getState().locks = locksReducer(locks, action);

        // add action back to stack
        store.getActions().push(action);
    });

    return store;
};

describe('redirectMiddleware', () => {
    describe('redirects on DEVICE.CONNECT event', () => {
        let goto: any;

        beforeEach(() => {
            goto = jest.spyOn(routerActions, 'goto');
        });

        afterEach(() => {
            goto.mockClear();
        });

        it('DEVICE.CONNECT mode=initialize', () => {
            const store = initStore(getInitialState());

            const connectDevice = mockConnectDevice({ mode: 'initialize' });
            store.dispatch({ type: DEVICE.CONNECT, payload: { device: connectDevice } });

            const device = store.getState().device.devices.find(d => d.id === connectDevice.id);
            store.dispatch({ type: deviceActions.selectDevice.type, payload: device });

            expect(goto).toHaveBeenNthCalledWith(1, 'suite-start');
        });

        it('DEVICE.CONNECT firmware=required', () => {
            const store = initStore(getInitialState());

            const connectDevice = mockConnectDevice({ mode: 'normal', firmware: 'required' });
            store.dispatch({ type: DEVICE.CONNECT, payload: { device: connectDevice } });

            const device = store.getState().device.devices.find(d => d.id === connectDevice.id);
            store.dispatch({ type: deviceActions.selectDevice.type, payload: device });

            expect(goto).toHaveBeenNthCalledWith(1, 'firmware-index');
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
            expect(goto).toHaveBeenNthCalledWith(1, 'wallet-index');
        });
    });
});
