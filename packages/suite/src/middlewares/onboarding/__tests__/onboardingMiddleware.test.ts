import type { UnknownAction } from '@reduxjs/toolkit';

import { modalReducer } from '@suite/modal';
import { appChanged, routerReducer } from '@suite/router';

import { SUITE } from 'src/actions/suite/constants';
import onboardingMiddlewares from 'src/middlewares/onboarding';
import onboardingReducer from 'src/reducers/onboarding/index';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { configureStore } from 'src/support/tests/configureStore';

const middlewares = [...onboardingMiddlewares];

jest.mock('@trezor/suite-storage', () => ({
    __esModule: true, // this property makes it work
    default: () => {},
}));

jest.mock('src/actions/suite/storageActions', () => ({ __esModule: true }));

type SuiteState = ReturnType<typeof suiteReducer>;
type RouterState = ReturnType<typeof routerReducer>;
type OnboardingState = ReturnType<typeof onboardingReducer>;

const getInitialState = (
    router?: RouterState,
    suite?: Partial<SuiteState>,
    onboarding?: Partial<OnboardingState>,
) => ({
    suite: {
        ...suiteReducer(undefined, appChanged('unknown')),
        ...suite,
    },
    router: {
        ...routerReducer(undefined, appChanged('unknown')),
        ...router,
    },
    onboarding: {
        ...onboardingReducer(undefined, appChanged('unknown')),
        ...onboarding,
    },
    modal: modalReducer(undefined, appChanged('unknown')),
});

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const mockStore = configureStore<State, any>([...middlewares]);

    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, router, onboarding } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().router = routerReducer(router, action as UnknownAction);
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
            await store.dispatch({ type: SUITE.APP_CHANGED, payload: 'onboarding' });
            const result = store.getActions();
            expect(result).toEqual([
                { type: SUITE.APP_CHANGED, payload: 'onboarding' },
                { type: '@onboarding/enable-onboarding-reducer', payload: true },
            ]);
        });
    });
});
