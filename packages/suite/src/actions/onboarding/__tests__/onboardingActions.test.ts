/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-object-literal-type-assertion */
/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import onboardingReducer from '@onboarding-reducers/onboardingReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import recoveryReducer from '@onboarding-reducers/recoveryReducer';
import fixtures, { deviceCallsSpecific, deviceCallsGeneral } from './fixtures/onboardingActions';

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
    let connectResponse: any;

    return {
        __esModule: true, // this property makes it work
        default: {
            getFeatures: () => Promise.resolve(connectResponse),
            applySettings: () => Promise.resolve(connectResponse),
            applyFlags: () => Promise.resolve(connectResponse),
            backupDevice: () => Promise.resolve(connectResponse),
            resetDevice: () => Promise.resolve(connectResponse),
            changePin: () => Promise.resolve(connectResponse),
            recoveryDevice: () => Promise.resolve(connectResponse),
            wipeDevice: () => Promise.resolve(connectResponse),
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
            if (!f || !f.mocks || !f.mocks.connectResponse) return;
            const { mocks } = f;
            connectResponse = mocks.connectResponse;
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
            recovery: {
                ...recoveryReducer(undefined, { type: 'foo' } as any),
            },
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

describe('Onboarding Actions - deviceCalls - general', () => {
    deviceCallsGeneral.forEach(f => {
        it(f.description, async () => {
            const store = mockStore(getInitialState(f.initialState));
            require('trezor-connect').setTestFixtures(f);

            const promise = store.dispatch(f.action());
            if (f.expect && f.expect.stateBeforeResolve) {
                expect(store.getState().onboarding).toMatchObject(f.expect.stateBeforeResolve);
            }
            await promise;
            if (f.expect && f.expect.stateAfterResolve) {
                expect(store.getState().onboarding).toMatchObject(f.expect.stateAfterResolve);
            }
        });
    });
});

describe('Onboarding Actions - deviceCalls - specific calls', () => {
    deviceCallsSpecific.forEach(f => {
        it(f.description, async () => {
            const store = mockStore(getInitialState(f.initialState));
            require('trezor-connect').setTestFixtures(f);

            const promise = store.dispatch(f.action());
            // if (f.expect && f.expect.stateBeforeResolve) {
            //     expect(store.getState().onboarding).toMatchObject(f.expect.stateBeforeResolve);
            // }
            await promise;
            // if (f.expect && f.expect.stateAfterResolve) {
            //     expect(store.getState().onboarding).toMatchObject(f.expect.stateAfterResolve);
            // }
        });
    });
});
