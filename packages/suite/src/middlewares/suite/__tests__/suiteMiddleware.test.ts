/* eslint-disable @typescript-eslint/no-var-requires */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { SUITE, ROUTER, STORAGE, ANALYTICS } from '@suite-actions/constants';
import routerReducer from '@suite-reducers/routerReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import modalReducer from '@suite-reducers/modalReducer';
import analyticsReducer from '@suite-reducers/analyticsReducer';
import * as routerActions from '@suite-actions/routerActions';
import suiteMiddleware from '@suite-middlewares/suiteMiddleware';

import routes from '@suite-constants/routes';
import { Action } from '@suite-types';

type SuiteState = ReturnType<typeof suiteReducer>;
type RouterState = ReturnType<typeof routerReducer>;

export const getInitialState = (router?: RouterState, suite?: Partial<SuiteState>) => ({
    router: {
        ...routerReducer(undefined, { type: 'foo' } as any),
        ...router,
    },
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
    modal: modalReducer(undefined, { type: 'foo' } as any),
    analytics: analyticsReducer(undefined, {
        type: ANALYTICS.INIT,
        payload: {
            instanceId: '1',
            sessionId: '2',
            enabled: false,
            confirmed: false,
            sessionStart: 1,
        },
    }),
    messageSystem: {
        timestamp: Date.now() + 10000,
    },
});

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
                    loaded: false,
                    url: '/',
                    pathname: '/',
                    hash: undefined,
                    app: 'unknown',
                    params: undefined,
                    route: undefined,
                }),
            );
            const payload = {
                url: '/',
                pathname: '/',
                app: 'dashboard',
                route: {
                    name: 'suite-index',
                    pattern: '/',
                    app: 'dashboard',
                    exact: true,
                },
            };
            store.dispatch({
                type: ROUTER.LOCATION_CHANGE,
                payload,
            });
            expect(store.getActions()).toEqual([
                { type: SUITE.APP_CHANGED, payload: 'dashboard' },
                {
                    type: ROUTER.LOCATION_CHANGE,
                    payload,
                },
            ]);
        });

        it('do not dispatch if prevApp === nextApp', () => {
            const store = initStore(
                getInitialState({
                    loaded: true,
                    url: '/onboarding',
                    pathname: '/onboarding',
                    hash: undefined,
                    app: 'onboarding',
                    params: undefined,
                    route: {
                        name: 'onboarding-index',
                        pattern: '/onboarding',
                        app: 'onboarding',
                        isForegroundApp: true,
                        isFullscreenApp: true,
                        params: undefined,
                        exact: undefined,
                    },
                }),
            );
            const payload = {
                url: '/onboarding',
                pathname: '/onboarding',
                app: 'onboarding',
                route: {
                    name: 'onboarding-index',
                    pattern: '/onboarding',
                    app: 'onboarding',
                    isForegroundApp: true,
                    isFullscreenApp: true,
                    params: undefined,
                    exact: undefined,
                },
            };
            store.dispatch({
                type: ROUTER.LOCATION_CHANGE,
                payload,
            });
            expect(store.getActions()).toEqual([{ type: ROUTER.LOCATION_CHANGE, payload }]);
        });
    });

    describe('redirection on initial run', () => {
        it('if initialRun is true, should redirect to onboarding screen after STORAGE.LOADED action', () => {
            // eslint-disable-next-line global-require
            require('@suite/support/history').default.location.pathname = '/accounts';

            const store = initStore(getInitialState());

            store.dispatch({
                type: STORAGE.LOADED,
                payload: {
                    suite: {
                        settings: {
                            language: 'cs',
                        },
                        flags: {
                            initialRun: true,
                        },
                    },
                    analytics: {},
                },
            });

            // redirect to suite-welcome called once
            const locationChangedAction = store
                .getActions()
                .filter(a => a.type === ROUTER.LOCATION_CHANGE);
            expect(locationChangedAction.length).toBe(1);
            expect(locationChangedAction[0].url).toBe(
                routes.find(r => r.name === 'onboarding-index')?.pattern,
            );
        });

        it('if route is modal window, should not redirect and show modal directly', () => {
            // eslint-disable-next-line global-require
            require('@suite/support/history').default.location.pathname = '/version';

            const store = initStore(getInitialState());

            store.dispatch({
                type: STORAGE.LOADED,
                payload: {
                    suite: {
                        settings: {
                            language: 'cs',
                        },
                        flags: {
                            initialRun: true,
                        },
                    },
                    analytics: {},
                },
            });

            // redirect to suite-version called once
            const locationChangedAction = store
                .getActions()
                .filter(a => a.type === ROUTER.LOCATION_CHANGE);
            expect(locationChangedAction.length).toBe(1);
            expect(locationChangedAction[0].url).toBe(
                routes.find(r => r.name === 'suite-version')?.pattern,
            );
        });

        it('if route is 404, should not redirect and show modal directly', () => {
            const goto = jest.spyOn(routerActions, 'goto');
            // eslint-disable-next-line global-require
            require('@suite/support/history').default.location.pathname = '/foo-bar';

            const store = initStore(getInitialState());

            store.dispatch({
                type: STORAGE.LOADED,
                payload: {
                    suite: {
                        settings: {
                            language: 'cs',
                        },
                        flags: {
                            initialRun: true,
                        },
                    },
                    analytics: {},
                },
            });
            expect(goto).toHaveBeenCalledTimes(0);

            goto.mockClear();
        });

        it('if initialRun is false should NOT redirect to onboarding after STORAGE.LOADED action', () => {
            const goto = jest.spyOn(routerActions, 'goto');
            // eslint-disable-next-line global-require
            require('@suite/support/history').default.location.pathname = '/';

            const store = initStore(getInitialState());
            store.dispatch({
                type: STORAGE.LOADED,
                payload: {
                    suite: {
                        settings: {
                            language: 'cs',
                        },
                        flags: {
                            initialRun: false,
                        },
                    },
                    analytics: {},
                },
            });
            expect(goto).toHaveBeenCalledTimes(0);
            goto.mockClear();
        });
    });
});
