/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable global-require */

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import merge from 'lodash/merge';

import firmwareReducer from '@suite-reducers/firmwareReducer';
import * as firwmareActions from '../firmwareActions';
import fixtures from './fixtures/firmwareActions';

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType[number];
type Fixture = ArrayElement<typeof fixtures>;

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

        setTestFixtures: (f: Fixture) => {
            fixture = f;
        },
    };
});

export const getInitialState = (override: any) => {
    const defaults = {
        suite: {
            device: {
                connected: true,
                type: 'acquired',
                features: {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    device_id: 'DEVICE-ID',
                    major_version: 2,
                },
            },
            uiLocked: false,
        },
        firmware: {
            status: null,
        },
    };
    if (override) {
        return merge(defaults, override);
    }
    return defaults;
};

const mockStore = configureStore<ReturnType<typeof getInitialState>, any>([thunk]);

const updateStore = (store: ReturnType<typeof mockStore>) => {
    // there is not much redux logic in this test
    // just update state on every action manually
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { firmware } = store.getState();
        store.getState().firmware = firmwareReducer(firmware, action);
        // add action back to stack
        store.getActions().push(action);
    });
};

describe('Firmware Actions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            // set fixtures
            require('trezor-connect').setTestFixtures(f);
            require('@trezor/rollout').setTestFixtures(f);

            const state = getInitialState(f.initialState);
            const store = mockStore(state);
            store.subscribe(() => updateStore(store));

            await store.dispatch(firwmareActions.firmwareUpdate());

            const result = store.getState();

            // console.log(f.description);
            // console.log('state', state);
            // console.log('result', '\n', result);
            // console.log('store.getActions()', '\n', store.getActions());

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
