import { modalReducer } from '@suite/modal';
import { routerAppChanged, routerReducer } from '@suite/router';
import { firmwareInitialState } from '@suite-common/firmware';

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
    firmware: firmwareInitialState,
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
    const mockStore = configureStore<State, any>([...middlewares]);

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
