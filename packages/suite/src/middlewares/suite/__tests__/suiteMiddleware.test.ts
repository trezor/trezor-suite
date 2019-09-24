import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { SUITE, ROUTER, STORAGE } from '@suite-actions/constants';
// import { BLOCKCHAIN } from '@wallet-actions/constants';
import routerReducer from '@suite-reducers/routerReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import * as routerActions from '@suite-actions/routerActions';
import suiteMiddleware from '@suite-middlewares/suiteMiddleware';

import { Action } from '@suite-types';

jest.mock('@trezor/suite-storage', () => {
    return {
        __esModule: true, // this property makes it work
        default: () => {},
    };
});

// just return whatever to avoid imports touching database which is not available in tests
jest.mock('@suite-actions/storageActions', () => {
    return {
        __esModule: true,
    };
});

jest.mock('next/router', () => {
    return {
        __esModule: true, // this property makes it work
        default: {
            push: () => {},
        },
    };
});

type SuiteState = ReturnType<typeof suiteReducer>;
type RouterState = ReturnType<typeof routerReducer>;

export const getInitialState = (router?: RouterState, suite?: Partial<SuiteState>) => {
    return {
        router: {
            ...routerReducer(undefined, { type: 'foo' } as any),
            ...router,
        },
        suite: {
            ...suiteReducer(undefined, { type: 'foo' } as any),
            ...suite,
        },
    };
};

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, Action>([thunk, suiteMiddleware]);
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, router } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().router = routerReducer(router, action);

        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('suite middleware', () => {
    describe('dispatch SUITE.APP_CHANGE action', () => {
        it('dispatch if prevApp !== nextApp', () => {
            const store = initStore(
                getInitialState({
                    url: '/',
                    pathname: '/',
                    hash: undefined,
                    app: 'notSpecified',
                    params: undefined,
                    route: {
                        name: 'suite-version',
                        pattern: '/version',
                        app: 'notSpecified',
                        isStatic: true,
                    },
                }),
            );
            store.dispatch({
                type: ROUTER.LOCATION_CHANGE,
                url: '/',
            });
            expect(store.getActions()).toEqual([
                { type: SUITE.APP_CHANGED, payload: 'wallet' },
                { type: ROUTER.LOCATION_CHANGE, url: '/' },
            ]);
        });

        it('do not dispatch if prevApp === nextApp', () => {
            const store = initStore(
                getInitialState({
                    url: '/onboarding',
                    pathname: '/',
                    hash: undefined,
                    app: 'onboarding',
                    params: undefined,
                    route: {
                        name: 'onboarding-index',
                        pattern: '/onboarding',
                        app: 'onboarding',
                        isStatic: true,
                    },
                }),
            );
            store.dispatch({
                type: ROUTER.LOCATION_CHANGE,
                url: '/onboarding',
            });
            expect(store.getActions()).toEqual([
                { type: ROUTER.LOCATION_CHANGE, url: '/onboarding' },
            ]);
        });
    });

    describe('redirects on initial run', () => {
        it('should redirect to onboarding after STORAGE.LOADED action', () => {
            const goto = jest.spyOn(routerActions, 'goto');

            const store = initStore(getInitialState());

            store.dispatch({
                type: STORAGE.LOADED,
                payload: {
                    suite: {
                        language: 'cs',
                        initialRun: true,
                    },
                },
            });
            expect(goto).toHaveBeenNthCalledWith(1, 'onboarding-index');

            goto.mockClear();
        });

        it('should NOT redirect to onboarding after STORAGE.LOADED action', () => {
            const goto = jest.spyOn(routerActions, 'goto');

            const store = initStore(getInitialState());
            store.dispatch({
                type: STORAGE.LOADED,
                payload: {
                    suite: {
                        language: 'cs',
                        initialRun: false,
                    },
                },
            });
            expect(goto).toHaveBeenCalledTimes(0);

            goto.mockClear();
        });
    });
});
