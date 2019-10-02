/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-object-literal-type-assertion */
/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import onboardingReducer from '@onboarding-reducers/onboardingReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import fixtures, { deviceCalls as deviceCallsFixtures } from './fixtures/onboardingActions';

import { Action } from '@suite-types';

const { getSuiteDevice } = global.JestMocks;

// todo fighting with typescript here. How to keep string literal being exported from fixtures and not converted
// to string? if exported as const, it makes all properties readonly and thus not assignable to reducer which
// expects mutable properties;

// type OnboardingState = Partial<ReturnType<typeof onboardingReducer>>;
// type SuiteState = Partial<ReturnType<typeof suiteReducer>>;
// interface State {
//     onboarding?: OnboardingState;
//     suite?: SuiteState;
// }

jest.mock('trezor-connect', () => {
    let applySettings: any;

    return {
        __esModule: true, // this property makes it work
        default: {
            getFeatures: () => {},
            applySettings: () => Promise.resolve(applySettings),
        },
        DEVICE: {
            DISCONNECT: 'device-disconnect',
        },
        TRANSPORT: {},
        IFRAME: {},
        UI: {
            REQUEST_BUTTON: 'ui-button',
            FIRMWARE_PROGRESS: 'ui-firmware-progress',
        },
        setTestFixtures: (f: any) => {
            if (!f || !f.mocks) return;
            const { mocks } = f;
            applySettings = mocks.applySettings;
        },
    };
});

export const getInitialState = (custom?: any) => {
    const suite = custom ? custom.suite : undefined;
    const onboarding = custom ? custom.onboarding : undefined;
    return {
        onboarding: {
            ...onboardingReducer(undefined, {} as Action),
            reducerEnabled: true,
            ...onboarding,
        },
        suite: {
            ...suiteReducer(undefined, {} as Action),
            device: getSuiteDevice(),
            ...suite,
        },
    };
};

const createStore = (initialState: ReturnType<typeof getInitialState>) => {
    const store = configureStore<ReturnType<typeof getInitialState>, any>([thunk])(initialState);
    return store;
};

const updateStore = (store: ReturnType<typeof createStore>) => {
    // there is not much redux logic in this test
    // just update state on every action manually
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { onboarding } = store.getState();

        // @ts-ignore
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

describe('Onboarding Actions - deviceCalls', () => {
    deviceCallsFixtures.forEach(f => {
        it(f.description, async () => {
            const store = mockStore(getInitialState(f.initialState));
            require('trezor-connect').setTestFixtures(f);

            const promise = store.dispatch(f.action());
            if (f.expect.stateBeforeResolve) {
                expect(store.getState().onboarding).toMatchObject(f.expect.stateBeforeResolve);
            }
            await promise;
            if (f.expect.stateAfterResolve) {
                expect(store.getState().onboarding).toMatchObject(f.expect.stateAfterResolve);
            }
        });
    });
});
