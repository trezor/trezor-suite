import { modalReducer } from '@suite/modal';
import { routerAppChanged, routerReducer } from '@suite/router';
import { type RouterStateOverrides, createRouterStateMock } from '@suite/router/mocks';
import { configureMockStore } from '@suite-common/test-utils';

import onboardingMiddlewares from 'src/middlewares/onboarding';
import onboardingReducer from 'src/reducers/onboarding/index';
import suiteReducer from 'src/reducers/suite/suiteReducer';

const middlewares = [...onboardingMiddlewares];

jest.mock('@trezor/suite-storage', () => ({
    __esModule: true, // this property makes it work
    default: () => {},
}));

jest.mock('src/actions/suite/storageActions', () => ({ __esModule: true }));

type SuiteState = ReturnType<typeof suiteReducer>;
type OnboardingState = ReturnType<typeof onboardingReducer>;

const getInitialState = (
    router?: RouterStateOverrides,
    suite?: Partial<SuiteState>,
    onboarding?: Partial<OnboardingState>,
) => ({
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
    router: createRouterStateMock(router),
    onboarding: {
        ...onboardingReducer(undefined, { type: 'foo' } as any),
        ...onboarding,
    },
    modal: modalReducer(undefined, { type: 'foo' } as any),
});

type State = ReturnType<typeof getInitialState>;

const initStore = (state: State) => {
    const store = configureMockStore({
        extra: undefined,
        middleware: [...middlewares],
        reducer: (currentState = state, action) => ({
            ...currentState,
            suite: suiteReducer(currentState.suite, action),
            router: routerReducer(currentState.router, action),
            onboarding: onboardingReducer(currentState.onboarding, action),
        }),
        preloadedState: state,
    });

    return store;
};

describe('onboardingMiddleware', () => {
    describe('routerAppChanged.type', () => {
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
            await store.dispatch({ type: routerAppChanged.type, payload: 'onboarding' });
            const result = store.getActions();
            expect(result).toEqual([
                { type: routerAppChanged.type, payload: 'onboarding' },
                { type: '@onboarding/enable-onboarding-reducer', payload: true },
            ]);
        });
    });
});
