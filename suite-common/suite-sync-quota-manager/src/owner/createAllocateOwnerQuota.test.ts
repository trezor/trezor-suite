import { DELEGATED_IDENTITY_KEY } from '@suite-common/delegated-identity-key-types/mocks';
import { createMockDeps } from '@suite-common/dependency-injection';
import { asSuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import { type WalletDescriptor, asWalletDescriptor } from '@trezor/device-utils';
import { err, ok } from '@trezor/type-utils';

import { DEFAULT_ACCOUNT_SIZE_QUOTA } from '../quotaManagerQuotaSize';
import { type AllocateOwnerQuotaDeps, createAllocateOwnerQuota } from './createAllocateOwnerQuota';

const ownerId = asSuiteSyncOwnerId('owner-id');
const walletDescriptor: WalletDescriptor = asWalletDescriptor('descriptor');
const deviceId = 'device-123';

describe(createAllocateOwnerQuota.name, () => {
    it("does not attempt allocation when write mode is off and returns 'WriteModeRequiredForAllocation'", async () => {
        const deps = createMockDeps<AllocateOwnerQuotaDeps>({
            getLeftDeviceQuota: () => undefined,
            prepareChallengeSessionFetch: null,
            transferStorageFetch: null,
        });

        const result = await createAllocateOwnerQuota(deps)({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceId,
            walletDescriptor,
            isWriteMode: false,
        });

        expect(result).toEqual(err({ type: 'WriteModeRequiredForAllocation' }));
        expect(deps.prepareChallengeSessionFetch).not.toHaveBeenCalled();
        expect(deps.transferStorageFetch).not.toHaveBeenCalled();
    });

    it('returns ok and does not attempt allocation when no quota is left', async () => {
        const deps = createMockDeps<AllocateOwnerQuotaDeps>({
            getLeftDeviceQuota: () => 0,
            prepareChallengeSessionFetch: null,
            transferStorageFetch: null,
        });

        const result = await createAllocateOwnerQuota(deps)({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceId,
            walletDescriptor,
            isWriteMode: true,
        });

        expect(result).toEqual(ok());
        expect(deps.prepareChallengeSessionFetch).not.toHaveBeenCalled();
        expect(deps.transferStorageFetch).not.toHaveBeenCalled();
    });

    it('maps challenge session failure to quota manager communication failure', async () => {
        const deps = createMockDeps<AllocateOwnerQuotaDeps>({
            getLeftDeviceQuota: () => undefined,
            prepareChallengeSessionFetch: () =>
                Promise.resolve(err({ type: 'HttpError', code: 500, message: 'Internal error' })),
            transferStorageFetch: null,
        });

        const result = await createAllocateOwnerQuota(deps)({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceId,
            walletDescriptor,
            isWriteMode: true,
        });

        expect(result).toEqual(
            err({
                type: 'QuotaManagerCommunicationFailed',
                caused: { type: 'HttpError', code: 500, message: 'Internal error' },
            }),
        );
        expect(deps.transferStorageFetch).not.toHaveBeenCalled();
    });

    it('requests storage transfer when owner storage is missing', async () => {
        const deps = createMockDeps<AllocateOwnerQuotaDeps>({
            getLeftDeviceQuota: () => undefined,
            prepareChallengeSessionFetch: () =>
                Promise.resolve(ok({ sessionId: 'session-123', challenge: 'aa55' })),
            transferStorageFetch: () =>
                Promise.resolve(ok({ publicKeyUnspentSpace: 0, ownerTotalSpace: 0 })),
        });

        const result = await createAllocateOwnerQuota(deps)({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceId,
            walletDescriptor,
            isWriteMode: true,
        });

        expect(result).toEqual(ok());
        expect(deps.prepareChallengeSessionFetch).toHaveBeenCalledWith();
        expect(deps.transferStorageFetch).toHaveBeenCalledWith({
            params: {
                ownerId,
                publicKey:
                    '0428a3cefc19b41ff56795e371aab72d6d85a3ca2200bd46c54e611a36222295a88b44d6f23ce94025b6010f9eb0f9168ad35d8396dc865fa0a16f2f5471816a45',
                proof: '2944ed0b226eb961750433b65639366871cf05a10dfd598a0651a39e18e5ada578f76fda26478316ac93115b1538bbad11044b83a59259efa8c2f9feaba1675b',
                size: DEFAULT_ACCOUNT_SIZE_QUOTA,
                challenge: 'aa55',
                sessionId: 'session-123',
            },
            walletDescriptor,
            deviceId,
        });
    });

    it('allocates only the remaining quota when it is below the default increment', async () => {
        const remainingQuota = 500;
        const deps = createMockDeps<AllocateOwnerQuotaDeps>({
            getLeftDeviceQuota: () => remainingQuota,
            prepareChallengeSessionFetch: () =>
                Promise.resolve(ok({ sessionId: 'session-456', challenge: 'bb66' })),
            transferStorageFetch: () =>
                Promise.resolve(ok({ publicKeyUnspentSpace: 0, ownerTotalSpace: 0 })),
        });

        await createAllocateOwnerQuota(deps)({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceId,
            walletDescriptor,
            isWriteMode: true,
        });

        expect(deps.transferStorageFetch).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    size: remainingQuota,
                }),
            }),
        );
    });
});
