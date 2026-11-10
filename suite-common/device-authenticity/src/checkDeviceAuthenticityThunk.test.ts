import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import {
    type PersistentDeviceDataRootState,
    persistentDeviceDataActions,
    preparePersistentDeviceDataReducer,
    selectDeviceAuthenticityByDeviceId,
} from '@suite-common/persistent-device-data';
import type { StoredAuthenticateDeviceResult, TrezorDevice } from '@suite-common/suite-types';
import { defaultDevicePersistentData, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot, testMocks } from '@suite-common/test-utils';
import { type ToastPayload, notificationsActions } from '@suite-common/toast-notifications';
import type { AuthenticateDeviceResult, Response } from '@trezor/connect';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';
import type { Err, Ok } from '@trezor/type-utils';

import {
    type CheckDeviceAuthenticityThunkState,
    checkDeviceAuthenticityThunk,
} from './checkDeviceAuthenticityThunk';

const initStore = (device?: TrezorDevice) =>
    createTestCompositionRoot<void, CheckDeviceAuthenticityThunkState>({
        preloadedState: {
            device: {
                selectedDevice: device,
                devices: device ? [device] : [],
            },
            messageSystem: messageSystemInitialState,
        },
    }).services.store;

const getDevice = (isLocked: boolean) => ({
    ...mockSuiteDevice(undefined, { bootloader_locked: isLocked }),
});

const connectCallFailResponse: Err<any> = {
    success: false,
    error: { message: 'error' },
};

const verificationSuccessResponse: Ok<AuthenticateDeviceResult> = {
    success: true,
    payload: {
        optigaResult: {
            valid: true,
            caPubKey: 'not-blacklisted-ca-pub-key',
            rootPubKey: 'recognized-root-pub-key',
        },
        tropicResult: null,
        mcuResult: null,
    },
};

const verifyFailureResponseNotFound: Ok<AuthenticateDeviceResult> = {
    success: true,
    payload: {
        optigaResult: {
            valid: false,
            error: 'ROOT_PUBKEY_NOT_FOUND',
            caPubKey: 'bad-ca-pub-key',
        },
        tropicResult: null,
        mcuResult: null,
    },
};

const verifyFailureResponseBlacklisted: Ok<AuthenticateDeviceResult> = {
    success: true,
    payload: {
        optigaResult: {
            valid: false,
            error: 'CA_PUBKEY_BLACKLISTED',
            caPubKey: 'blacklisted-root-pub-key',
        },
        tropicResult: null,
        mcuResult: null,
    },
};

const deviceWithLockedBootloader = getDevice(true);

type Fixture = {
    description: string;
    device: TrezorDevice | undefined;
    mockedConnectResponse?: Awaited<Response<AuthenticateDeviceResult>>;
    expectedFulfilled: boolean;
    expectedToastType?: ToastPayload['type'];
    // Inconclusive result is not persisted, so that the result of a previous check is kept.
    expectedIsResultPersisted: boolean;
    expectedResult?: StoredAuthenticateDeviceResult;
};

const fixtures: Fixture[] = [
    {
        description: 'Success',
        device: deviceWithLockedBootloader,
        mockedConnectResponse: verificationSuccessResponse,
        expectedFulfilled: true,
        expectedToastType: 'device-authenticity-success',
        expectedIsResultPersisted: true,
        expectedResult: { valid: true, ...verificationSuccessResponse.payload },
    },
    {
        description: 'Success - skip toast',
        device: deviceWithLockedBootloader,
        mockedConnectResponse: verificationSuccessResponse,
        expectedFulfilled: true,
        expectedIsResultPersisted: true,
        expectedResult: { valid: true, ...verificationSuccessResponse.payload },
    },
    {
        description: 'Exception - missing device',
        device: undefined,
        expectedFulfilled: false,
        expectedIsResultPersisted: false,
    },
    {
        description: 'No result - aborted on device or some other error',
        device: deviceWithLockedBootloader,
        mockedConnectResponse: connectCallFailResponse,
        expectedFulfilled: false,
        expectedToastType: 'error',
        expectedIsResultPersisted: false,
    },
    {
        description: 'Error - root pub key not found',
        device: deviceWithLockedBootloader,
        mockedConnectResponse: verifyFailureResponseNotFound,
        expectedFulfilled: false,
        expectedToastType: 'device-authenticity-error',
        expectedIsResultPersisted: true,
        expectedResult: { valid: false, ...verifyFailureResponseNotFound.payload },
    },
    {
        description: 'Error - caPubKey is blacklisted',
        device: deviceWithLockedBootloader,
        mockedConnectResponse: verifyFailureResponseBlacklisted,
        expectedFulfilled: false,
        expectedToastType: 'device-authenticity-error',
        expectedIsResultPersisted: true,
        expectedResult: { valid: false, ...verifyFailureResponseBlacklisted.payload },
    },
    {
        description: 'Error - bootloader unlocked',
        device: getDevice(false),
        mockedConnectResponse: connectCallFailResponse,
        expectedFulfilled: false,
        expectedToastType: 'error',
        expectedIsResultPersisted: true,
        expectedResult: { valid: false, error: 'error' },
    },
];

describe('Check device authenticity', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            const store = initStore(f.device);
            testMocks.setTrezorConnectFixtures(f.mockedConnectResponse);
            await store.dispatch(
                checkDeviceAuthenticityThunk({
                    allowDebugKeys: false,
                    skipSuccessToast: !f.expectedToastType,
                }),
            );

            const actions = store.getActions();
            // always expecting to have started
            const expectedActions = [checkDeviceAuthenticityThunk.pending.type];
            // expected to have emitted toast
            if (f.expectedToastType) {
                expectedActions.splice(1, 0, notificationsActions.addToast.type);
                const toastAction = actions.find(notificationsActions.addToast.match);
                expect(toastAction?.payload.type).toBe(f.expectedToastType);
            }
            // thunk is expected to fail fast if there is no device, and not emit a result, which is always bound to device
            if (f.expectedIsResultPersisted) {
                expectedActions.push(persistentDeviceDataActions.setDeviceAuthenticityResult.type);
                const resultAction = actions.find(
                    persistentDeviceDataActions.setDeviceAuthenticityResult.match,
                );
                expect(resultAction?.payload.result).toEqual(f.expectedResult);
            }
            if (f.expectedFulfilled) {
                expectedActions.push(checkDeviceAuthenticityThunk.fulfilled.type);
            } else {
                expectedActions.push(checkDeviceAuthenticityThunk.rejected.type);
            }
            expect(actions.map(action => action.type)).toEqual(expectedActions);
        });
    });
});

describe('Check device authenticity: persisted result of a previous check', () => {
    const persistentDeviceDataReducer = preparePersistentDeviceDataReducer({
        actionTypes: { storageLoad: mockActionType('storageLoad') },
        reducers: { storageLoadPersistentDeviceData: mockReducer() },
    });
    type State = CheckDeviceAuthenticityThunkState & PersistentDeviceDataRootState;

    const DEVICE_ID = 'device-id';

    // Only the persisted device data is processed by a real reducer, other slices stay static.
    const createReducer =
        (initialState: State) =>
        (
            state = initialState,
            action: Parameters<typeof persistentDeviceDataReducer>[1],
        ): State => ({
            ...state,
            persistentDeviceData: persistentDeviceDataReducer(state.persistentDeviceData, action),
        });

    const checkWithPersistedResult = async (
        persistedResult: StoredAuthenticateDeviceResult,
        mockedConnectResponse: Awaited<Response<AuthenticateDeviceResult>>,
    ) => {
        const device = mockSuiteDevice({ id: DEVICE_ID }, { bootloader_locked: true });
        const initialState: State = {
            device: { ...deviceInitialState, selectedDevice: device, devices: [device] },
            messageSystem: messageSystemInitialState,
            persistentDeviceData: {
                devices: [
                    {
                        ...defaultDevicePersistentData,
                        device_id: DEVICE_ID,
                        authenticityResult: persistedResult,
                    },
                ],
            },
        };
        const { store } = createTestCompositionRoot<void, State>({
            reducer: createReducer(initialState),
            preloadedState: initialState,
        }).services;
        testMocks.setTrezorConnectFixtures(mockedConnectResponse);
        await store.dispatch(checkDeviceAuthenticityThunk({ allowDebugKeys: false }));

        return selectDeviceAuthenticityByDeviceId(store.getState(), DEVICE_ID);
    };

    it('keeps the persisted success when the check is inconclusive', async () => {
        const persistedResult = { valid: true, ...verificationSuccessResponse.payload };

        expect(await checkWithPersistedResult(persistedResult, connectCallFailResponse)).toEqual(
            persistedResult,
        );
    });

    it('keeps the persisted failure when the check is inconclusive', async () => {
        const persistedResult = { valid: false, ...verifyFailureResponseNotFound.payload };

        expect(await checkWithPersistedResult(persistedResult, connectCallFailResponse)).toEqual(
            persistedResult,
        );
    });

    it('overwrites the persisted failure with a conclusive result', async () => {
        const persistedResult = { valid: false, ...verifyFailureResponseNotFound.payload };

        expect(
            await checkWithPersistedResult(persistedResult, verificationSuccessResponse),
        ).toEqual({ valid: true, ...verificationSuccessResponse.payload });
    });
});
