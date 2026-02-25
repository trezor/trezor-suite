import { deviceActions } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { StoredAuthenticateDeviceResult, TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore, testMocks } from '@suite-common/test-utils';
import { ToastPayload, notificationsActions } from '@suite-common/toast-notifications';
import type { AuthenticateDeviceResult, Response } from '@trezor/connect';
import { Err, Ok } from '@trezor/type-utils';

import { checkDeviceAuthenticityThunk } from '../src/checkDeviceAuthenticityThunk';

const initStore = (device?: TrezorDevice) =>
    configureMockStore({
        extra: {
            selectors: {
                selectDevice: () => device,
            },
        },
        preloadedState: {
            messageSystem: messageSystemInitialState,
        },
    });

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
    },
};

const deviceWithLockedBootloader = getDevice(true);

type Fixture = {
    description: string;
    device: TrezorDevice | undefined;
    mockedConnectResponse?: Awaited<Response<AuthenticateDeviceResult>>;
    expectedFulfilled: boolean;
    expectedToastType?: ToastPayload['type'];
    expectedResult?: StoredAuthenticateDeviceResult;
};

const fixtures: Fixture[] = [
    {
        description: 'Success',
        device: deviceWithLockedBootloader,
        mockedConnectResponse: verificationSuccessResponse,
        expectedFulfilled: true,
        expectedToastType: 'device-authenticity-success',
        expectedResult: { valid: true, ...verificationSuccessResponse.payload },
    },
    {
        description: 'Success - skip toast',
        device: deviceWithLockedBootloader,
        mockedConnectResponse: verificationSuccessResponse,
        expectedFulfilled: true,
        expectedResult: { valid: true, ...verificationSuccessResponse.payload },
    },
    {
        description: 'Exception - missing device',
        device: undefined,
        expectedFulfilled: false,
    },
    {
        description: 'No result - aborted on device or some other error',
        device: deviceWithLockedBootloader,
        mockedConnectResponse: connectCallFailResponse,
        expectedFulfilled: false,
        expectedToastType: 'error',
        expectedResult: undefined,
    },
    {
        description: 'Error - root pub key not found',
        device: deviceWithLockedBootloader,
        mockedConnectResponse: verifyFailureResponseNotFound,
        expectedFulfilled: false,
        expectedToastType: 'device-authenticity-error',
        expectedResult: { valid: false, ...verifyFailureResponseNotFound.payload },
    },
    {
        description: 'Error - caPubKey is blacklisted',
        device: deviceWithLockedBootloader,
        mockedConnectResponse: verifyFailureResponseBlacklisted,
        expectedFulfilled: false,
        expectedToastType: 'device-authenticity-error',
        expectedResult: { valid: false, ...verifyFailureResponseBlacklisted.payload },
    },
    {
        description: 'Error - bootloader unlocked',
        device: getDevice(false),
        mockedConnectResponse: connectCallFailResponse,
        expectedFulfilled: false,
        expectedToastType: 'error',
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
                expect(actions[actions.length - 3].payload.type).toBe(f.expectedToastType);
            }
            // thunk is expected to fail fast if there is no device, and not emit a result, which is always bound to device
            if (f.device) {
                expectedActions.push(deviceActions.setDeviceAuthenticityResult.type);
            }
            if (f.expectedFulfilled) {
                expectedActions.push(checkDeviceAuthenticityThunk.fulfilled.type);
                expect(actions[actions.length - 2].payload.result).toEqual(f.expectedResult);
            } else {
                expectedActions.push(checkDeviceAuthenticityThunk.rejected.type);
            }
            expect(actions.map(action => action.type)).toEqual(expectedActions);
        });
    });
});
