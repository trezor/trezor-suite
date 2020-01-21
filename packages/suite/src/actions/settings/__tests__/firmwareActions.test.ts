/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable global-require */

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import firmwareReducer from '@suite-reducers/firmwareReducer';
import suiteReducer from '@suite-reducers/suiteReducer';
import { ArrayElement } from '@suite/types/utils';
import * as firmwareActions from '../firmwareActions';
import { firmwareUpdate, reducerActions } from '../__fixtures__/firmwareActions';

type Fixture = ArrayElement<typeof firmwareUpdate>;

type SuiteState = ReturnType<typeof suiteReducer>;
type FirmwareState = ReturnType<typeof firmwareReducer>;
interface InitialState {
    suite?: Partial<SuiteState>;
    firmware?: Partial<FirmwareState>;
}

jest.mock('@trezor/rollout', () => {
    let fixture: Fixture;

    const getFw = async () => {
        if (typeof fixture === 'undefined' || !fixture.mocks || !fixture.mocks.rollout) {
            return 'Default error. Fixtures not set';
        }
        const { rollout } = fixture.mocks;
        if (rollout.error) {
            throw rollout.error;
        }

        return Promise.resolve(rollout.success);
    };
    return {
        __esModule: true, // this property makes it work
        default: () => ({
            getFw,
        }),
        setTestFixtures: (f: Fixture) => {
            fixture = f;
        },
    };
});

jest.mock('trezor-connect', () => {
    let fixture: Fixture;

    // mocked function
    const firmwareUpdate = async () => {
        // this error applies only for tests
        if (typeof fixture === 'undefined' || !fixture.mocks || !fixture.mocks.connect) {
            return 'Default error. Fixtures not set';
        }

        return Promise.resolve(fixture.mocks.connect);
    };

    return {
        __esModule: true, // this property makes it work
        default: {
            getFeatures: () => {},
            firmwareUpdate,
        },
        DEVICE: {
            DISCONNECT: 'device-disconnect',
        },
        TRANSPORT: {},
        UI: {
            REQUEST_BUTTON: 'ui-button',
            FIRMWARE_PROGRESS: 'ui-firmware-progress',
        },
        setTestFixtures: (f: Fixture) => {
            fixture = f;
        },
    };
});

export const getInitialState = (override?: InitialState): any => {
    const suite = override ? override.suite : undefined;
    const firmware = override ? override.firmware : undefined;
    return {
        suite: {
            device: {
                connected: true,
                type: 'acquired',
                features: {
                    major_version: 2,
                },
            },
            locks: [],
            ...suite,
        },
        firmware: {
            reducerEnabled: true,
            ...firmware,
        },
    };
};

const mockStore = configureStore<ReturnType<typeof getInitialState>, any>([thunk]);

const updateStore = (store: ReturnType<typeof mockStore>) => {
    // there is not much redux logic in this test
    // just update state on every action manually
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { firmware, suite } = store.getState();
        store.getState().firmware = firmwareReducer(firmware, action);
        store.getState().suite = suiteReducer(suite, action);

        // add action back to stack
        store.getActions().push(action);
    });
};

describe('Firmware Actions', () => {
    describe('firmwareUpdate', () => {
        firmwareUpdate.forEach(f => {
            it(f.description, async () => {
                // set fixtures
                require('trezor-connect').setTestFixtures(f);
                require('@trezor/rollout').setTestFixtures(f);

                const state = getInitialState(f.initialState);
                const store = mockStore(state);

                store.subscribe(() => updateStore(store));

                await store.dispatch(firmwareActions.firmwareUpdate());

                const result = store.getState();

                if (f.result) {
                    if (f.result.state) {
                        expect(result).toMatchObject(f.result.state);
                    }
                    if (f.result.actions) {
                        f.result.actions.forEach((action, index) => {
                            expect(store.getActions()[index].type).toEqual(action.type);
                            expect(store.getActions()[index].payload).toEqual(action.payload);
                        });
                    }
                }
            });
        });
    });

    describe('reducer actions', () => {
        reducerActions.forEach(f => {
            it(f.description, async () => {
                const state = getInitialState(f.initialState);
                const store = mockStore(state);
                store.subscribe(() => updateStore(store));
                store.dispatch(f.action);
                if (f.result) {
                    if (f.result.state) {
                        expect(store.getState()).toMatchObject(f.result.state);
                    }
                }
            });
        });
    });
});
