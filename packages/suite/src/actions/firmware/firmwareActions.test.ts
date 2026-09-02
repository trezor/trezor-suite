import { suiteSettingsInitialState } from '@suite/settings';
import type { DeviceReducerState } from '@suite-common/device';
import { type FirmwareUpdateThunkDeps, prepareFirmwareReducer } from '@suite-common/firmware';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import {
    mockGetBinFilesBaseUrl,
    mockGetLanguage,
    mockReportSecurityCheck,
} from '@suite-common/suite-types/mocks';
import { createTestStore, filterThunkActionTypes, testMocks } from '@suite-common/test-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import suiteReducer from 'src/reducers/suite/suiteReducer';

import { actions, reducerActions } from './__fixtures__/firmwareActions';
const firmwareReducer = prepareFirmwareReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});
const extra: FirmwareUpdateThunkDeps = {
    services: {
        getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
        getLanguage: mockGetLanguage(),
        reportSecurityCheck: mockReportSecurityCheck(),
    },
};

type SuiteState = ReturnType<typeof suiteReducer>;
type FirmwareState = ReturnType<typeof firmwareReducer>;
interface InitialState {
    suite?: Partial<SuiteState>;
    suiteSettings?: Partial<typeof suiteSettingsInitialState>;
    firmware?: Partial<FirmwareState>;
    device?: Partial<DeviceReducerState>;
}

const getInitialState = (override?: InitialState): any => {
    const suite = override ? override.suite : undefined;
    const suiteSettings = override ? override.suiteSettings : undefined;
    const device = override ? override.device : undefined;

    return {
        suite: {
            ...suiteReducer(undefined, { type: 'foo' } as any),
            ...suite,
        },
        suiteSettings: {
            ...suiteSettingsInitialState,
            language: 'en',
            ...suiteSettings,
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

const mockStore = (preloadedState: ReturnType<typeof getInitialState>) =>
    createTestStore({
        extra,
        reducer: (state = preloadedState, action) => ({
            ...state,
            firmware: firmwareReducer(state.firmware, action),
            suite: suiteReducer(state.suite, action),
        }),
        preloadedState,
    });

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
