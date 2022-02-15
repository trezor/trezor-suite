import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { SUITE } from '@suite-actions/constants';

import routerReducer from '@suite-reducers/routerReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import modalReducer from '@suite-reducers/modalReducer';
import onboardingReducer from '@onboarding-reducers/index';
import onboardingMiddlewares from '@onboarding-middlewares';

const middlewares = [...onboardingMiddlewares];

jest.mock('@trezor/suite-storage', () => ({
    __esModule: true, // this property makes it work
    default: () => {},
}));

jest.mock('@suite-actions/storageActions', () => ({ __esModule: true }));

type SuiteState = ReturnType<typeof suiteReducer>;
type RouterState = ReturnType<typeof routerReducer>;
type OnboardingState = ReturnType<typeof onboardingReducer>;

const getInitialState = (
    router?: RouterState,
    suite?: Partial<SuiteState>,
    onboarding?: Partial<OnboardingState>,
) => ({
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
    router: {
        ...routerReducer(undefined, { type: 'foo' } as any),
        ...router,
    },
    onboarding: {
        ...onboardingReducer(undefined, { type: 'foo' } as any),
        ...onboarding,
    },
    modal: modalReducer(undefined, { type: 'foo' } as any),
});

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, any>([thunk, ...middlewares]);

    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, router, onboarding } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().router = routerReducer(router, action);
        store.getState().onboarding = onboardingReducer(onboarding, action);

        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('onboardingMiddleware', () => {
    describe('SUITE.APP_CHANGED', () => {
        it('payload=onboarding (into onboarding)', async () => {
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
            await store.dispatch({ type: SUITE.APP_CHANGED, payload: 'onboarding' });
            const result = store.getActions();
            expect(result).toEqual([
                { type: SUITE.APP_CHANGED, payload: 'onboarding' },
                { type: '@onboarding/enable-onboarding-reducer', payload: true },
            ]);
        });

        it('from onboarding', async () => {
            const store = initStore(
                getInitialState({
                    loaded: true,
                    url: '/onboarding',
                    pathname: '/',
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
            await store.dispatch({ type: SUITE.APP_CHANGED, payload: 'wallet' });
            const result = store.getActions();
            expect(result).toEqual([
                { type: SUITE.APP_CHANGED, payload: 'wallet' },
                { type: '@suite/set-flag', key: 'initialRun', value: false },
                { type: '@onboarding/reset-onboarding' },
            ]);
        });
    });
});
