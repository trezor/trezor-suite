import { DEVICE } from 'trezor-connect';
import configureStore from 'redux-mock-store';
import { Middleware } from 'redux';
import thunk from 'redux-thunk';

import * as routerActions from '@suite-actions/routerActions';
import { SUITE } from '@suite-actions/constants';

import routerReducer from '@suite-reducers/routerReducer';
import deviceReducer from '@suite-reducers/deviceReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import modalReducer from '@suite-reducers/modalReducer';

import suiteMiddleware from '@suite-middlewares/suiteMiddleware';
import redirectMiddleware from '@suite-middlewares/redirectMiddleware';
import { Action } from '@suite-types';

const { getSuiteDevice } = global.JestMocks;

jest.mock('next/router', () => ({
    __esModule: true, // this property makes it work
    default: {
        push: () => {},
    },
}));

jest.mock('@suite-actions/storageActions', () => ({ __esModule: true }));

type SuiteState = ReturnType<typeof suiteReducer>;
type DevicesState = ReturnType<typeof deviceReducer>;
type RouterState = ReturnType<typeof routerReducer>;
type ModalState = ReturnType<typeof modalReducer>;

export const getInitialState = (
    suite?: Partial<SuiteState>,
    devices?: DevicesState,
    router?: Partial<RouterState>,
    modal?: Partial<ModalState>,
) => ({
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
    devices: devices || [],
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
const middlewares: Middleware<any, any>[] = [thunk, redirectMiddleware, suiteMiddleware];

const initStore = (state: State) => {
    const mockStore = configureStore<State, Action>(middlewares);
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, router, devices } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().router = routerReducer(router as RouterState, action);
        store.getState().devices = deviceReducer(devices, action);

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
            expect(goto).toHaveBeenNthCalledWith(1, 'onboarding-index');
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
                    {
                        device: getSuiteDevice(
                            {
                                path: '2',
                            },
                            {
                                // eslint-disable-next-line @typescript-eslint/naming-convention
                                device_id: 'previous-device',
                            },
                        ),
                    },
                    undefined,
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
                            isModal: undefined,
                        },
                    },
                ),
            );
            store.dispatch({
                type: SUITE.SELECT_DEVICE,
                payload: getSuiteDevice(),
            });
            expect(goto).toHaveBeenNthCalledWith(1, 'wallet-index');
        });
    });
});
