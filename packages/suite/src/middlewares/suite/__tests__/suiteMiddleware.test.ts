import { configureStore } from '@suite/support/tests/configureStore';
import { SUITE, ROUTER } from '@suite-actions/constants';
import routerReducer from '@suite-reducers/routerReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import modalReducer from '@suite-reducers/modalReducer';
import suiteMiddleware from '@suite-middlewares/suiteMiddleware';
import type { Action } from '@suite-types';
import { extraDependencies } from '@suite/support/extraDependencies';

import { analyticsActions, prepareAnalyticsReducer } from '@suite-common/analytics';

type SuiteState = ReturnType<typeof suiteReducer>;
type RouterState = ReturnType<typeof routerReducer>;

const analyticsReducer = prepareAnalyticsReducer(extraDependencies);

const getInitialState = (router?: RouterState, suite?: Partial<SuiteState>) => ({
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
        type: analyticsActions.initAnalytics.type,
        payload: {
            instanceId: '1',
            sessionId: '2',
            enabled: false,
            confirmed: false,
        },
    }),
    messageSystem: {
        timestamp: Date.now() + 10000,
    },
});

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, Action>([suiteMiddleware]);
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
                    settingsBackRoute: {
                        name: 'suite-index',
                    },
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
                    settingsBackRoute: {
                        name: 'suite-index',
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
});
