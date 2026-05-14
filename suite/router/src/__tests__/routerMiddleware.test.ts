import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';

import { getRoute } from '../router';
import { routerMiddleware } from '../routerMiddleware';
import type { RouterState } from '../routerReducer';
import { routerAppChanged, routerLocationChange, routerReducer } from '../routerReducer';

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

const initStore = (router?: Partial<RouterState>) => {
    const store = configureMockStore({
        middleware: [routerMiddleware(() => extraDependenciesCommonMock)],
        reducer: { router: routerReducer },
        preloadedState: {
            router: {
                ...routerReducer(undefined, { type: 'test-init' }),
                ...router,
            },
        },
    });

    return store;
};

describe('routerMiddleware', () => {
    describe('dispatch @router/appChanged action', () => {
        it('dispatch if prevApp !== nextApp', () => {
            const store = initStore({ app: 'unknown' });
            const payload: LocationChangePayload = {
                pathname: '/' as const,
                app: 'dashboard',
                route: getRequiredRoute('suite-index'),
                params: undefined,
            };
            store.dispatch(routerLocationChange(payload));
            expect(store.getActions()).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        type: routerAppChanged.type,
                        payload: 'dashboard',
                    }),
                ]),
            );
        });

        it('do not dispatch if prevApp === nextApp', () => {
            const store = initStore({
                loaded: true,
                pathname: '/onboarding',
                app: 'onboarding',
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
            });
            const payload: LocationChangePayload = {
                pathname: '/onboarding' as const,
                app: 'onboarding',
                route: getRequiredRoute('onboarding-index'),
                params: undefined,
            };
            store.dispatch(routerLocationChange(payload));
            const actions = store.getActions();
            expect(actions.some(a => a.type === routerAppChanged.type)).toBe(false);
        });
    });
});
