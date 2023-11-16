import { TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { configureMockStore, testMocks } from '@suite-common/test-utils';
import { AuthenticateDeviceResult, Response as ConnectResponse } from '@trezor/connect';

import { deviceAuthenticityActions } from '../src/deviceAuthenticityActions';
import { checkDeviceAuthenticityThunk } from '../src/deviceAuthenticityThunks';

jest.mock('@trezor/connect', () => {
    let fixture: ConnectResponse<AuthenticateDeviceResult>;
    return {
        ...jest.requireActual('@trezor/connect'),
        __esModule: true,
        default: {
            authenticateDevice: () => fixture,
        },
        setTestFixtures: (f: ConnectResponse<AuthenticateDeviceResult>) => {
            fixture = f;
        },
    };
});

const initStore = (device?: TrezorDevice) =>
    configureMockStore({
        extra: {
            selectors: {
                selectDevice: () => device,
            },
        },
    });

const getDevice = (isLocked: boolean) => ({
    ...testMocks.getSuiteDevice(undefined, { bootloader_locked: isLocked }),
});

const successResponse = {
    success: true,
    payload: {
        valid: true,
    },
};
const failResponse = {
    success: false,
    payload: { error: 'error' },
};
const failResult = { valid: false, error: 'error' };
const deviceWithLockedBootloader = getDevice(true);

const fixtures = [
    {
        description: 'Success',
        device: deviceWithLockedBootloader,
        connectResponse: successResponse,
        expectedToastType: 'device-authenticity-success',
        expectedResult: { valid: true },
    },
    {
        description: 'Success - skip toast',
        device: deviceWithLockedBootloader,
        connectResponse: successResponse,
        expectedResult: { valid: true },
    },
    {
        description: 'Success - despite expired config',
        device: deviceWithLockedBootloader,
        connectResponse: {
            success: true,
            payload: { valid: false, error: 'CA_PUBKEY_NOT_FOUND', configExpired: true },
        },
        expectedToastType: 'device-authenticity-success',
        expectedResult: { valid: true, error: 'CA_PUBKEY_NOT_FOUND', configExpired: true },
    },
    {
        description: 'Exception - missing device',
        device: undefined,
    },
    {
        description: 'No result - aborted on device or some other error',
        device: deviceWithLockedBootloader,
        connectResponse: failResponse,
        expectedToastType: 'error',
        expectedResult: undefined,
    },
    {
        description: 'Fail - bootloader unlocked',
        device: getDevice(false),
        connectResponse: failResponse,
        expectedToastType: 'error',
        expectedResult: failResult,
    },
    {
        description: 'Fail',
        device: deviceWithLockedBootloader,
        connectResponse: {
            success: true,
            payload: failResult,
        },
        expectedToastType: 'device-authenticity-error',
        expectedResult: failResult,
    },
];

describe('Check device authenticity', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            const store = initStore(f.device);
            // eslint-disable-next-line
            require('@trezor/connect').setTestFixtures(f.connectResponse);
            await store.dispatch(
                checkDeviceAuthenticityThunk({
                    allowDebugKeys: false,
                    skipSuccessToast: !f.expectedToastType,
                }),
            );

            const actions = store.getActions();
            const expectedActions = [checkDeviceAuthenticityThunk.pending.type];
            if (f.expectedToastType) {
                expectedActions.splice(1, 0, notificationsActions.addToast.type);
                expect(actions[1].payload.type).toBe(f.expectedToastType);
            }
            if (f.device) {
                expectedActions.push(deviceAuthenticityActions.result.type);
                expectedActions.push(checkDeviceAuthenticityThunk.fulfilled.type);
                expect(actions[actions.length - 2].payload.result).toEqual(f.expectedResult);
            } else {
                expectedActions.push(checkDeviceAuthenticityThunk.rejected.type);
            }
            expect(actions.map(action => action.type)).toEqual(expectedActions);
        });
    });
});
