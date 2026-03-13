import { recoveryReducer } from '@suite/recovery';
import { modalReducer } from '@suite/modal';
import { routerReducer } from '@suite/router';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { locksInitialState } from '@suite/locks';

import onboardingReducer from 'src/reducers/onboarding/onboardingReducer';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { configureStore } from 'src/support/tests/configureStore';
import { Action } from 'src/types/suite';

import * as onboardingActions from '../onboardingActions';
import fixtures from '../__fixtures__/onboardingActions';

// Mock startDiscoveryThunk to avoid needing full wallet/discovery state in these unit tests.
jest.mock('@suite-common/wallet-core', () => ({
    startDiscoveryThunk: () => ({ type: 'mock/startDiscovery' }),
}));

// todo fighting with typescript here. How to keep string literal being exported from fixtures and not converted
// to string? if exported as const, it makes all properties readonly and thus not assignable to reducer which
// expects mutable properties;

// type OnboardingState = Partial<ReturnType<typeof onboardingReducer>>;
// type SuiteState = Partial<ReturnType<typeof suiteReducer>>;
// interface State {
//     onboarding?: OnboardingState;
//     suite?: SuiteState;
// }

const getInitialState = (custom?: any) => {
    const suite = custom ? custom.suite : undefined;
    const onboarding = custom ? custom.onboarding : undefined;
    const device = custom ? custom.device : undefined;

    return {
        onboarding: {
            ...onboardingReducer(undefined, {} as Action),
            isActive: true,
            ...onboarding,
            recovery: {
                ...recoveryReducer(undefined, { type: 'foo' } as any),
            },
        },
        suite: {
            ...suiteReducer(undefined, {} as Action),
            ...suite,
        },
        device: device ?? {},
    };
};

const createStore = (initialState: ReturnType<typeof getInitialState>) => {
    const store = configureStore<ReturnType<typeof getInitialState>, any>()(initialState);

    return store;
};

const updateStore = (store: ReturnType<typeof createStore>) => {
    // there is not much redux logic in this test
    // just update state on every action manually
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { onboarding } = store.getState();

        store.getState().onboarding = onboardingReducer(onboarding, action);
        // add action back to stack
        store.getActions().push(action);
    });
};

const mockStore = (initialState: ReturnType<typeof getInitialState>) => {
    const store = createStore(initialState);
    store.subscribe(() => updateStore(store));

    return store;
};

describe('Onboarding Actions', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            const store = mockStore(getInitialState(f.initialState));
            store.dispatch(f.action());
            const stateAfter = store.getState().onboarding;
            if (f.expect.toMatchObject) {
                expect(stateAfter).toMatchObject(f.expect.toMatchObject);
            }
        });
    });
});

describe('goToSuite analytics', () => {
    const analyticsReportSpy = jest.fn();

    const createGoToSuiteStore = (onboardingAnalytics: Record<string, unknown>) => {
        const initialState = {
            ...getInitialState({
                device: {
                    selectedDevice: mockSuiteDevice({ connected: true }, { initialized: true }),
                },
                onboarding: {
                    onboardingAnalytics,
                },
            }),
            locks: locksInitialState,
            modal: modalReducer(undefined, { type: 'foo' } as Action),
            router: routerReducer(undefined, { type: 'foo' } as Action),
        };

        return configureStore<typeof initialState, any>(undefined, {
            services: { analytics: { report: analyticsReportSpy } },
        })(initialState);
    };

    beforeEach(() => {
        analyticsReportSpy.mockClear();
    });

    it('should NOT report device-setup-completed when onboardingAnalytics is empty (returning user path)', () => {
        const store = createGoToSuiteStore({});
        store.dispatch(onboardingActions.goToSuite());
        expect(analyticsReportSpy).not.toHaveBeenCalled();
    });

    it('should NOT report device-setup-completed when only startTime is set (premature goToSuite call)', () => {
        const store = createGoToSuiteStore({ startTime: Date.now() });
        store.dispatch(onboardingActions.goToSuite());
        expect(analyticsReportSpy).not.toHaveBeenCalled();
    });

    it('should report device-setup-completed when seed is "create"', () => {
        const store = createGoToSuiteStore({
            startTime: Date.now(),
            seed: 'create',
            firmware: 'up-to-date',
        });
        store.dispatch(onboardingActions.goToSuite());
        expect(analyticsReportSpy).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'device-setup-completed' }),
        );
    });

    it('should report device-setup-completed when seed is "recovery"', () => {
        const store = createGoToSuiteStore({
            startTime: Date.now(),
            seed: 'recovery',
            firmware: 'install',
        });
        store.dispatch(onboardingActions.goToSuite());
        expect(analyticsReportSpy).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'device-setup-completed' }),
        );
    });

    it('should report device-setup-completed when seed is "recovery-in-progress"', () => {
        const store = createGoToSuiteStore({
            startTime: Date.now(),
            seed: 'recovery-in-progress',
        });
        store.dispatch(onboardingActions.goToSuite());
        expect(analyticsReportSpy).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'device-setup-completed' }),
        );
    });
});
