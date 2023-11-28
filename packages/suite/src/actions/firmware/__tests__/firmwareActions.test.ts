import { testMocks } from '@suite-common/test-utils';
import { prepareFirmwareReducer, State as DeviceState } from '@suite-common/wallet-core';
import { DeviceModelInternal } from '@trezor/connect';

import { configureStore, filterThunkActionTypes } from 'src/support/tests/configureStore';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { extraDependencies } from 'src/support/extraDependencies';

import { actions, reducerActions } from '../__fixtures__/firmwareActions';

const firmwareReducer = prepareFirmwareReducer(extraDependencies);

type SuiteState = ReturnType<typeof suiteReducer>;
type FirmwareState = ReturnType<typeof firmwareReducer>;
interface InitialState {
    suite?: Partial<SuiteState>;
    firmware?: Partial<FirmwareState>;
    device?: Partial<DeviceState>;
}

jest.doMock('@trezor/suite-analytics', () => testMocks.getAnalytics());

export const getInitialState = (override?: InitialState): any => {
    const suite = override ? override.suite : undefined;
    const device = override ? override.device : undefined;

    return {
        suite: {
            locks: [],
            flags: {},
            ...suite,
        },
        firmware: firmwareReducer(undefined, { type: 'foo' } as any),
        device: {
            selectedDevice: {
                connected: true,
                type: 'acquired',
                features: {
                    major_version: 2,
                    internal_model: DeviceModelInternal.T2T1,
                },
            },
            ...device,
        },
        analytics: {
            enabled: false,
        },
    };
};

const mockStore = configureStore<ReturnType<typeof getInitialState>, any>();

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
    beforeAll(() => {
        jest.spyOn(console, 'warn').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterAll(() => {
        jest.clearAllMocks();
    });

    actions.forEach(f => {
        it(f.description, async () => {
            // set fixtures
            testMocks.setTrezorConnectFixtures(f.mocks?.connect);

            const state = getInitialState(f.initialState);
            const store = mockStore(state);

            store.subscribe(() => updateStore(store));

            await store.dispatch(f.action());

            const result = store.getState();

            if (f.result) {
                if (f.result.state) {
                    expect(result).toMatchObject(f.result.state);
                }
                if (f.result.actions) {
                    expect(filterThunkActionTypes(store.getActions())).toMatchObject(
                        f.result.actions,
                    );
                }
            }
        });
    });

    describe('reducer actions', () => {
        reducerActions.forEach(f => {
            it(f.description, () => {
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
