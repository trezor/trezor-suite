import { locksInitialState, locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { goto, routerReducer } from '@suite/router';
import { type RouterStateOverrides, createRouterStateMock } from '@suite/router/mocks';
import { deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { DEVICE } from '@trezor/connect';

import redirectMiddleware from 'src/middlewares/suite/redirectMiddleware';
import { prepareSuiteMiddleware } from 'src/middlewares/suite/suiteMiddleware';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { extraDependencies } from 'src/support/extraDependencies';

jest.mock('src/actions/suite/storageActions', () => ({ __esModule: true }));
jest.mock('@suite/router', () => ({
    ...jest.requireActual('@suite/router'),
    goto: jest.fn(() => ({ type: '@router/goto/mocked' })),
}));

const deviceReducer = prepareDeviceReducer(extraDependencies);

type SuiteState = ReturnType<typeof suiteReducer>;
type DevicesState = ReturnType<typeof deviceReducer>;
type ModalState = ReturnType<typeof modalReducer>;

const getInitialState = (
    suite?: Partial<SuiteState>,
    device?: Partial<DevicesState>,
    router?: RouterStateOverrides,
    modal?: Partial<ModalState>,
) => ({
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
    modal: {
        ...modalReducer(undefined, { type: 'foo' } as any),
        ...modal,
    },
    messageSystem: {},
});

type State = ReturnType<typeof getInitialState>;
const middlewares = [redirectMiddleware, prepareSuiteMiddleware(() => extraDependenciesCommonMock)];

const initStore = (state: State) => {
    const store = configureMockStore<State>({
        middleware: middlewares,
        reducer: (currentState = state, action) => {
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
        const gotoMock = jest.mocked(goto);

        afterEach(() => {
            gotoMock.mockClear();
        });

        it('DEVICE.CONNECT mode=initialize', () => {
            const store = initStore(getInitialState());

            const connectDevice = mockConnectDevice({ mode: 'initialize' });
            store.dispatch({ type: DEVICE.CONNECT, payload: { device: connectDevice } });

            const device = store.getState().device.devices.find(d => d.id === connectDevice.id);
            store.dispatch({ type: deviceActions.selectDevice.type, payload: device });

            expect(gotoMock).toHaveBeenNthCalledWith(1, { routeName: 'suite-start' });
        });

        it('DEVICE.CONNECT firmware=required', () => {
            const store = initStore(getInitialState());

            const connectDevice = mockConnectDevice({ mode: 'normal', firmware: 'required' });
            store.dispatch({ type: DEVICE.CONNECT, payload: { device: connectDevice } });

            const device = store.getState().device.devices.find(d => d.id === connectDevice.id);
            store.dispatch({ type: deviceActions.selectDevice.type, payload: device });

            expect(gotoMock).toHaveBeenNthCalledWith(1, { routeName: 'firmware-index' });
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
            expect(gotoMock).toHaveBeenNthCalledWith(1, { routeName: 'wallet-index' });
        });
    });
});
