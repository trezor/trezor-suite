import { type ModalRootState, modalReducer } from '@suite/modal';
import { type RouterRootState, routerAppChanged, routerReducer } from '@suite/router';
import { type RouterStateOverrides, createRouterStateMock } from '@suite/router/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import onboardingMiddlewares from 'src/middlewares/onboarding';
import onboardingReducer from 'src/reducers/onboarding/index';
import { type OnboardingRootState } from 'src/reducers/onboarding/onboardingReducer';
import suiteReducer, { type SuiteRootState } from 'src/reducers/suite/suiteReducer';

const middlewares = [...onboardingMiddlewares];

jest.mock('@trezor/suite-storage', () => ({
    __esModule: true, // this property makes it work
    default: () => {},
}));

jest.mock('src/actions/suite/storageActions', () => ({ __esModule: true }));

type State = SuiteRootState & RouterRootState & OnboardingRootState & ModalRootState;

const getInitialState = (
    router?: RouterStateOverrides,
    suite?: Partial<State['suite']>,
    onboarding?: Partial<State['onboarding']>,
): State => ({
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

const initStore = (state: State) =>
    createTestCompositionRoot<void, State>({
        middleware: [...middlewares],
        reducer: (currentState = state, action) => ({
            ...currentState,
            suite: suiteReducer(currentState.suite, action),
            router: routerReducer(currentState.router, action),
            onboarding: onboardingReducer(currentState.onboarding, action),
        }),
        preloadedState: state,
    }).services.store;

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
