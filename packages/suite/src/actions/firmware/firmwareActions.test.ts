import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import {
    type FirmwareUpdateThunkDeps,
    type FirmwareUpdateThunkState,
    prepareFirmwareReducer,
} from '@suite-common/firmware';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import {
    mockGetBinFilesBaseUrl,
    mockGetLanguage,
    mockReportSecurityCheck,
    mockSuiteDevice,
} from '@suite-common/suite-types/mocks';
import {
    createTestCompositionRoot,
    filterThunkActionTypes,
    testMocks,
} from '@suite-common/test-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import { actions, reducerActions } from './__fixtures__/firmwareActions';

const firmwareReducer = prepareFirmwareReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});
interface InitialState {
    firmware?: Partial<FirmwareUpdateThunkState['firmware']>;
    device?: Partial<DeviceReducerState>;
}

const getInitialState = (override?: InitialState): FirmwareUpdateThunkState => {
    const device = override ? override.device : undefined;

    return {
        firmware: {
            ...firmwareReducer(undefined, { type: 'foo' } as any),
            ...override?.firmware,
        },
        device: {
            ...deviceInitialState,
            selectedDevice: mockSuiteDevice(
                {
                    connected: true,
                    type: 'acquired',
                },
                { major_version: 2, internal_model: DeviceModelInternal.T2T1 },
            ),
            ...device,
        },
    };
};

const mockStore = (preloadedState: FirmwareUpdateThunkState) =>
    createTestCompositionRoot<FirmwareUpdateThunkDeps, FirmwareUpdateThunkState>({
        reducer: (state = preloadedState, action) => ({
            ...state,
            firmware: firmwareReducer(state.firmware, action),
        }),
        preloadedState,
        services: () => ({
            getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
            getLanguage: mockGetLanguage(),
            reportSecurityCheck: mockReportSecurityCheck(),
        }),
    }).services.store;

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
