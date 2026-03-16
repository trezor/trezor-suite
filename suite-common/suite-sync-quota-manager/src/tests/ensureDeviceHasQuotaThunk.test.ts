import { mocked } from 'jest-mock';

import { DELEGATED_IDENTITY_KEY } from '@suite-common/delegated-identity-key-types/mocks';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import TrezorConnect from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { err, ok } from '@trezor/type-utils';

import { prepareChallengeSession } from '../challenge/prepareChallengeSession';
import { DEFAULT_DEVICE_SIZE_QUOTA } from '../constants';
import { ensureDeviceHasQuotaThunk } from '../ensureDeviceHasQuotaThunk';
import { type SuiteSyncQuotaManagerState, quotaManagerInitialState } from '../quotaManagerReducer';
import { checkStorageByPublicKey } from '../storage/checkStorage';
import { registerStorageThunk } from '../storage/registerStorageThunk';

jest.mock('../challenge/prepareChallengeSession', () => ({
    prepareChallengeSession: jest.fn(),
}));

jest.mock('../storage/checkStorage', () => ({
    checkStorageByPublicKey: jest.fn(),
}));

jest.mock('../storage/registerStorageThunk', () => ({
    registerStorageThunk: jest.fn(),
}));

const createGetState = (statePatch?: Partial<SuiteSyncQuotaManagerState>) => () => ({
    suiteSyncQuotaManager: {
        ...quotaManagerInitialState,
        baseUrl: 'https://quota-manager.test',
        ...statePatch,
    },
});

const device = mockSuiteDevice(
    { id: 'device-id' },
    { internal_model: DeviceModelInternal.T2T1 },
) as TrezorDeviceWithState;

const prepareChallengeSessionMock = mocked(prepareChallengeSession);
const checkStorageByPublicKeyMock = mocked(checkStorageByPublicKey);

const registerStorageThunkMock = mocked(registerStorageThunk);
let evoluSignRegistrationRequestSpy: jest.SpyInstance;

describe(ensureDeviceHasQuotaThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();

        if (!evoluSignRegistrationRequestSpy) {
            evoluSignRegistrationRequestSpy = jest.spyOn(
                TrezorConnect,
                'evoluSignRegistrationRequest',
            );
        }

        evoluSignRegistrationRequestSpy.mockReset();
        registerStorageThunkMock.mockReturnValue(jest.fn());
    });

    afterAll(() => {
        if (evoluSignRegistrationRequestSpy) {
            evoluSignRegistrationRequestSpy.mockRestore();
        }
    });

    it('dispatches device fetched when storage already exists', async () => {
        const getState = createGetState();
        const dispatch = jest.fn();

        checkStorageByPublicKeyMock.mockResolvedValue(ok({ totalSpace: 5000, unspentSpace: 1200 }));

        await ensureDeviceHasQuotaThunk({ delegatedKey: DELEGATED_IDENTITY_KEY, device })(
            dispatch,
            getState,
        );

        expect(checkStorageByPublicKeyMock).toHaveBeenCalledWith({
            baseUrl: 'https://quota-manager.test',
            publicKey:
                '0428a3cefc19b41ff56795e371aab72d6d85a3ca2200bd46c54e611a36222295a88b44d6f23ce94025b6010f9eb0f9168ad35d8396dc865fa0a16f2f5471816a45',
        });
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: '@suite/quota-manager/deviceFetched',
                payload: {
                    deviceId: 'device-id',
                    totalStorageSize: 5000,
                    unspentStorageSize: 1200,
                },
            }),
        );
        expect(prepareChallengeSessionMock).not.toHaveBeenCalled();
        expect(registerStorageThunkMock).not.toHaveBeenCalled();
    });

    it('dispatches quota manager error for non-404 failures', async () => {
        const getState = createGetState();
        const dispatch = jest.fn();

        checkStorageByPublicKeyMock.mockResolvedValue(
            err({ type: 'HttpError', code: 500, message: 'Internal error' }),
        );

        await ensureDeviceHasQuotaThunk({ delegatedKey: DELEGATED_IDENTITY_KEY, device })(
            dispatch,
            getState,
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: '@suite/quota-manager/fetchError',
                payload: {
                    error: 'Internal error',
                },
            }),
        );
        expect(prepareChallengeSessionMock).not.toHaveBeenCalled();
    });

    it('requests registration when storage is missing', async () => {
        const getState = createGetState();
        const dispatch: ReturnType<typeof jest.fn> = jest.fn((action: unknown) => {
            if (typeof action === 'function')
                return (action as (...args: any[]) => any)(dispatch, getState);

            return action;
        });

        checkStorageByPublicKeyMock.mockResolvedValue(
            err({ type: 'HttpError', code: 404, message: 'Not Found' }),
        );
        prepareChallengeSessionMock.mockResolvedValue(
            ok({ sessionId: 'session-123', challenge: 'aa55' }),
        );

        const registerThunkInner = jest.fn();
        registerStorageThunkMock.mockReturnValue(registerThunkInner);

        evoluSignRegistrationRequestSpy.mockResolvedValue({
            success: true,
            payload: {
                certificate_chain: ['device-cert', 'ca-cert'],
                signature: 'device-signature',
            },
        });

        await ensureDeviceHasQuotaThunk({ delegatedKey: DELEGATED_IDENTITY_KEY, device })(
            dispatch,
            getState,
        );

        expect(prepareChallengeSessionMock).toHaveBeenCalledWith({
            baseUrl: 'https://quota-manager.test',
        });
        expect(evoluSignRegistrationRequestSpy).toHaveBeenCalledWith({
            challenge_from_server: 'aa55',
            size_to_acquire: DEFAULT_DEVICE_SIZE_QUOTA,
            proof_of_delegated_identity:
                '9d40167d8ec7ce7949f1675d60a4d5c2a6ec5f16152bdc6c7959af99c856d31570c0d262996917cf424a3e638a7ee10b57aa2864c06895b0728d09f040496177',
        });
        expect(registerStorageThunkMock).toHaveBeenCalledWith({
            size: DEFAULT_DEVICE_SIZE_QUOTA,
            certificateChain: {
                deviceCert: 'device-cert',
                caCert: 'ca-cert',
            },
            challenge: 'aa55',
            proof: 'device-signature',
            sessionId: 'session-123',
            deviceModel: 'T2T1',
            publicKey:
                '0428a3cefc19b41ff56795e371aab72d6d85a3ca2200bd46c54e611a36222295a88b44d6f23ce94025b6010f9eb0f9168ad35d8396dc865fa0a16f2f5471816a45',
        });
        expect(registerThunkInner).toHaveBeenCalled();
    });
});
