import type { UnknownAction } from '@reduxjs/toolkit';

import { modalReducer } from '@suite/modal';
import { appChanged, getRoute, routerLocationChange, routerReducer } from '@suite/router';
import { analyticsActions, prepareAnalyticsReducer } from '@suite-common/analytics-redux';
import { prepareDeviceReducer } from '@suite-common/device';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';

import { prepareSuiteMiddleware } from 'src/middlewares/suite/suiteMiddleware';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { extraDependencies } from 'src/support/extraDependencies';
import { configureStore } from 'src/support/tests/configureStore';
import type { Action } from 'src/types/suite';

type SuiteState = ReturnType<typeof suiteReducer>;
type RouterState = ReturnType<typeof routerReducer>;
type LocationChangePayload = Parameters<typeof routerLocationChange>[0];

const getRequiredRoute = <TName extends NonNullable<LocationChangePayload['route']>['name']>(
    name: TName,
) => {
    const route = getRoute(name);

    if (!route) {
        throw new Error(`Missing route ${name}`);
    }

    return route as Extract<NonNullable<LocationChangePayload['route']>, { name: TName }>;
};

const analyticsReducer = prepareAnalyticsReducer(extraDependencies);
const deviceReducer = prepareDeviceReducer(extraDependencies);
const EMPTY_ACTION = appChanged('unknown');

const getInitialState = (router?: RouterState, suite?: Partial<SuiteState>) => ({
    router: {
        ...routerReducer(undefined, EMPTY_ACTION),
        ...router,
    },
    suite: {
        ...suiteReducer(undefined, EMPTY_ACTION),
        ...suite,
    },
    device: {
        ...deviceReducer(undefined, EMPTY_ACTION),
    },
    modal: modalReducer(undefined, EMPTY_ACTION),
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
    const mockStore = configureStore<State, Action>([
        prepareSuiteMiddleware(() => extraDependenciesCommonMock),
    ]);
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        if (!action) {
            return;
        }

        const { suite, router } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().router = routerReducer(router, action as UnknownAction);

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
                    pathname: '/',
                    hash: '',
                    search: '',
                    app: 'unknown',
                    params: undefined,
                    route: undefined,
                    settingsBackRoute: {
                        name: 'suite-index',
                    },
                }),
            );
            const payload: LocationChangePayload = {
                pathname: '/' as const,
                app: 'dashboard',
                route: getRequiredRoute('suite-index'),
                params: undefined,
            };
            store.dispatch(routerLocationChange(payload));
            expect(store.getActions()).toEqual([
                { type: appChanged.type, payload: 'dashboard' },
                routerLocationChange(payload),
            ]);
        });

        it('do not dispatch if prevApp === nextApp', () => {
            const store = initStore(
                getInitialState({
                    loaded: true,
                    pathname: '/onboarding',
                    hash: '',
                    search: '',
                    app: 'onboarding',
                    params: undefined,
                    route: {
                        name: 'onboarding-index',
                        pattern: '/onboarding',
                        app: 'onboarding',
                        isForegroundApp: true,
                        isFullscreenApp: true,
                        clearUrl: undefined,
                        isNestedRoute: undefined,
                        params: undefined,
                        hasNestedRoutes: undefined,
                    },
                    settingsBackRoute: {
                        name: 'suite-index',
                    },
                }),
            );
            const payload: LocationChangePayload = {
                pathname: '/onboarding' as const,
                app: 'onboarding',
                route: getRequiredRoute('onboarding-index'),
                params: undefined,
            };
            store.dispatch({
                type: routerLocationChange.type,
                payload,
            });
            expect(store.getActions()).toEqual([routerLocationChange(payload)]);
        });
    });
});
