import { DELEGATED_IDENTITY_KEY } from '@suite-common/delegated-identity-key-types/mocks';
import { createMockDeps } from '@suite-common/dependency-injection';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';
import { err, ok } from '@trezor/type-utils';

import { DEFAULT_DEVICE_SIZE_QUOTA } from '../../quotaManagerQuotaSize';
import { type RegisterDeviceDeps, createRegisterDevice } from '../createRegisterDevice';

const deviceWithLegacyRegistrationRequest = mockSuiteDevice(
    { id: 'device-id-v1' },
    {
        internal_model: DeviceModelInternal.T2T1,
        major_version: 2,
        minor_version: 12,
        patch_version: 1,
    },
) as TrezorDeviceWithState;
const deviceWithV2RegistrationRequest = mockSuiteDevice(
    { id: 'device-id-v2' },
    {
        internal_model: DeviceModelInternal.T2T1,
        major_version: 2,
        minor_version: 12,
        patch_version: 2,
    },
) as TrezorDeviceWithState;

describe(createRegisterDevice.name, () => {
    it('registers device using challenge session and Connect signature', async () => {
        const deps = createMockDeps<RegisterDeviceDeps>({
            prepareChallengeSessionFetch: () =>
                Promise.resolve(ok({ sessionId: 'session-123', challenge: 'aa55' })),
            registerDeviceFetch: () =>
                Promise.resolve(ok({ totalStorageSize: 5000, unspentStorageSize: 1200 })),
            trezorConnect: {
                evoluSignRegistrationRequest: () =>
                    Promise.resolve(
                        ok({
                            certificate_chain: ['device-cert', 'ca-cert'],
                            signature: 'device-signature',
                        }),
                    ),
            },
            dispatch: jest.fn(),
        });

        const result = await createRegisterDevice(deps)({
            delegatedKey: DELEGATED_IDENTITY_KEY,
            device: deviceWithLegacyRegistrationRequest,
        });

        expect(result).toEqual(ok());
        expect(deps.prepareChallengeSessionFetch).toHaveBeenCalledWith();
        expect(deps.trezorConnect.evoluSignRegistrationRequest).toHaveBeenCalledWith({
            challenge_from_server: 'aa55',
            size_to_acquire: DEFAULT_DEVICE_SIZE_QUOTA,
            proof_of_delegated_identity:
                '9d40167d8ec7ce7949f1675d60a4d5c2a6ec5f16152bdc6c7959af99c856d31570c0d262996917cf424a3e638a7ee10b57aa2864c06895b0728d09f040496177',
        });
        expect(deps.registerDeviceFetch).toHaveBeenCalledWith({
            deviceId: 'device-id-v1',
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
    });

    it('registers device with rotation index returned by firmware', async () => {
        const deps = createMockDeps<RegisterDeviceDeps>({
            prepareChallengeSessionFetch: () =>
                Promise.resolve(ok({ sessionId: 'session-123', challenge: 'aa55' })),
            registerDeviceFetch: () =>
                Promise.resolve(ok({ totalStorageSize: 5000, unspentStorageSize: 1200 })),
            trezorConnect: {
                evoluSignRegistrationRequest: () =>
                    Promise.resolve(
                        ok({
                            certificate_chain: ['device-cert', 'ca-cert'],
                            signature: 'device-signature',
                            rotation_index: 42,
                        }),
                    ),
            },
            dispatch: jest.fn(),
        });

        const result = await createRegisterDevice(deps)({
            delegatedKey: DELEGATED_IDENTITY_KEY,
            device: deviceWithV2RegistrationRequest,
        });

        expect(result).toEqual(ok());
        expect(deps.registerDeviceFetch).toHaveBeenCalledWith(
            expect.objectContaining({
                rotationIndex: 42,
            }),
        );
    });

    it('falls back to zero rotation index when V2 firmware does not return rotation index', async () => {
        const deps = createMockDeps<RegisterDeviceDeps>({
            prepareChallengeSessionFetch: () =>
                Promise.resolve(ok({ sessionId: 'session-123', challenge: 'aa55' })),
            registerDeviceFetch: () =>
                Promise.resolve(ok({ totalStorageSize: 5000, unspentStorageSize: 1200 })),
            trezorConnect: {
                evoluSignRegistrationRequest: () =>
                    Promise.resolve(
                        ok({
                            certificate_chain: ['device-cert', 'ca-cert'],
                            signature: 'device-signature',
                        }),
                    ),
            },
            dispatch: jest.fn(),
        });

        const result = await createRegisterDevice(deps)({
            delegatedKey: DELEGATED_IDENTITY_KEY,
            device: deviceWithV2RegistrationRequest,
        });

        expect(result).toEqual(ok());
        expect(deps.registerDeviceFetch).toHaveBeenCalledWith(
            expect.objectContaining({
                rotationIndex: 0,
            }),
        );
    });

    it('maps challenge session failure to quota manager communication failure', async () => {
        const deps = createMockDeps<RegisterDeviceDeps>({
            prepareChallengeSessionFetch: () =>
                Promise.resolve(err({ type: 'HttpError', code: 500, message: 'Internal error' })),
            registerDeviceFetch: null,
            trezorConnect: {
                evoluSignRegistrationRequest: null,
            },
            dispatch: jest.fn(),
        });

        const result = await createRegisterDevice(deps)({
            delegatedKey: DELEGATED_IDENTITY_KEY,
            device: deviceWithLegacyRegistrationRequest,
        });

        expect(result).toEqual(
            err({
                type: 'QuotaManagerCommunicationFailed',
                caused: { type: 'HttpError', code: 500, message: 'Internal error' },
            }),
        );
        expect(deps.registerDeviceFetch).not.toHaveBeenCalled();
    });
});
