import { Middleware } from 'redux';

import { deviceActions, prepareDeviceReducer } from '@suite-common/wallet-core';
import { DEVICE } from '@trezor/connect';
import { testMocks } from '@suite-common/test-utils';

import { configureStore } from 'src/support/tests/configureStore';
import * as routerActions from 'src/actions/suite/routerActions';
import routerReducer from 'src/reducers/suite/routerReducer';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import modalReducer from 'src/reducers/suite/modalReducer';
import suiteMiddleware from 'src/middlewares/suite/suiteMiddleware';
import redirectMiddleware from 'src/middlewares/suite/redirectMiddleware';
import { Action } from 'src/types/suite';
import { extraDependencies } from 'src/support/extraDependencies';

const { getSuiteDevice } = testMocks;

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
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
    device: {
        ...deviceReducer(undefined, { type: 'foo' } as any),
        ...device,
    },
    router: {
        ...routerReducer(undefined, { type: 'foo' } as any),
        ...router,
    },
    modal: {
        ...modalReducer(undefined, { type: 'foo' } as any),
        ...modal,
    },
    messageSystem: {},
});

type State = ReturnType<typeof getInitialState>;
const middlewares: Middleware<any, any>[] = [redirectMiddleware, suiteMiddleware];

const initStore = (state: State) => {
    const mockStore = configureStore<State, Action>(middlewares);
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, router, device } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().router = routerReducer(router as RouterState, action);
        store.getState().device = deviceReducer(device, action);

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
            store.dispatch({
                type: DEVICE.CONNECT,
                payload: getSuiteDevice({ mode: 'initialize' }),
            });
            expect(goto).toHaveBeenNthCalledWith(1, 'suite-start');
        });

        it('DEVICE.CONNECT firmware=required', () => {
            const store = initStore(getInitialState());
            store.dispatch({
                type: DEVICE.CONNECT,
                payload: getSuiteDevice({ mode: 'normal', firmware: 'required' }),
            });
            expect(goto).toHaveBeenNthCalledWith(1, 'firmware-index');
        });

        it('SUITE.SELECT_DEVICE reset wallet params', () => {
            const store = initStore(
                getInitialState(
                    undefined,
                    {
                        devices: [],
                        selectedDevice: getSuiteDevice(
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
                            exact: true,
                        },
                    },
                ),
            );
            store.dispatch({
                type: deviceActions.selectDevice.type,
                payload: getSuiteDevice(),
            });
            expect(goto).toHaveBeenNthCalledWith(1, 'wallet-index');
        });
    });
});
