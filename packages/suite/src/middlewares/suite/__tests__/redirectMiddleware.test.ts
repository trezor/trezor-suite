import { DEVICE } from 'trezor-connect';
import configureStore from 'redux-mock-store';
import { Middleware } from 'redux';
import thunk from 'redux-thunk';

import { SUITE } from '@suite-actions/constants';
import { BLOCKCHAIN } from '@wallet-actions/constants';

import * as routerActions from '@suite-actions/routerActions';

import routerReducer from '@suite-reducers/routerReducer';
import deviceReducer from '@suite-reducers/deviceReducer';
import suiteReducer from '@suite/reducers/suite/suiteReducer';
import modalReducer from '@suite/reducers/suite/modalReducer';

import suiteMiddlewares from '@suite-middlewares';
import { Action } from '@suite-types';

const { getSuiteDevice } = global.JestMocks;

jest.mock('next/router', () => {
    return {
        __esModule: true, // this property makes it work
        default: {
            push: () => {},
        },
    };
});

jest.mock('@suite-actions/storageActions', () => {
    return {
        __esModule: true,
        loadStorage: () => {
            return {
                type: BLOCKCHAIN.READY,
            };
        },
    };
});

type SuiteState = ReturnType<typeof suiteReducer>;
type DevicesState = ReturnType<typeof deviceReducer>;
type RouterState = ReturnType<typeof routerReducer>;
type ModalState = ReturnType<typeof modalReducer>;

export const getInitialState = (
    suite?: Partial<SuiteState>,
    devices?: DevicesState,
    router?: Exclude<RouterState, 'app|url|pathname'>,
    modal?: Partial<ModalState>,
) => {
    return {
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
    };
};

type State = ReturnType<typeof getInitialState>;
const middlewares: Middleware<any, any>[] = [thunk, ...suiteMiddlewares];

const initStore = (state: State) => {
    const mockStore = configureStore<State, Action>(middlewares);
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, router, devices } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().router = routerReducer(router, action);
        store.getState().devices = deviceReducer(devices, action);

        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('redirectMiddleware', () => {
    describe('redirects on DEVICE.CONNECT event', () => {
        it('DEVICE.CONNECT mode=initialize', () => {
            const store = initStore(getInitialState());
            const goto = jest.spyOn(routerActions, 'goto');
            store.dispatch({
                type: DEVICE.CONNECT,
                payload: getSuiteDevice({ mode: 'initialize' }),
            });

            expect(goto).toHaveBeenNthCalledWith(1, 'onboarding-index');
            goto.mockClear();
        });

        it('DEVICE.CONNECT firmware=required', () => {
            const store = initStore(getInitialState());
            const goto = jest.spyOn(routerActions, 'goto');

            store.dispatch({
                type: DEVICE.CONNECT,
                payload: getSuiteDevice({ mode: 'normal', firmware: 'required' }),
            });

            expect(goto).toHaveBeenNthCalledWith(1, 'suite-device-firmware');
            goto.mockClear();
        });
    });

    describe('redirects on initial run', () => {
        it('should redirect to onboarding after SUITE.READY action', () => {
            const goto = jest.spyOn(routerActions, 'goto');

            const store = initStore(getInitialState({ initialRun: true, locks: [] }));

            store.dispatch({ type: SUITE.READY });
            expect(goto).toHaveBeenNthCalledWith(1, 'onboarding-index');

            goto.mockClear();
        });

        it('should NOT redirect to onboarding after SUITE.READY action', () => {
            const goto = jest.spyOn(routerActions, 'goto');

            const store = initStore(getInitialState({ initialRun: false, locks: [] }));
            store.dispatch({ type: SUITE.READY });
            expect(goto).toHaveBeenCalledTimes(0);

            goto.mockClear();
        });
    });
});
