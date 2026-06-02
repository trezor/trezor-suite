import { DELEGATED_IDENTITY_KEY } from '@suite-common/delegated-identity-key-types/mocks';
import { mock } from '@suite-common/dependency-injection';
import { asSuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import { type WalletDescriptor, asWalletDescriptor } from '@suite-common/wallet';
import { type StaticSessionId } from '@trezor/connect-common';
import { err, ok } from '@trezor/type-utils';

import { createEnsureOwnerHasAllocatedQuotaDepsMock } from '../device/mocks/createEnsureOwnerHasAllocatedQuotaDepsMock';
import { QuotaManagerCommunicationFailed } from '../errors';
import { type AllocateOwnerQuota } from '../owner/createAllocateOwnerQuota';
import { createEnsureOwnerHasAllocatedQuota } from '../owner/createEnsureOwnerHasAllocatedQuota';

const ownerId = asSuiteSyncOwnerId('owner-id');
const walletDescriptor: WalletDescriptor = asWalletDescriptor('descriptor');
const deviceId = 'device-123';
const deviceStaticSessionId = `${walletDescriptor}@${deviceId}` as StaticSessionId;

describe(createEnsureOwnerHasAllocatedQuota.name, () => {
    it('dispatches owner fetched when storage already exists', async () => {
        const deps = createEnsureOwnerHasAllocatedQuotaDepsMock({
            checkStorageByOwnerIdResponses: [ok({ status: 'Allocated', totalSpace: 2048 })],
        });

        const result = await createEnsureOwnerHasAllocatedQuota(deps)({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceStaticSessionId,
            isWriteMode: false,
        });

        expect(result).toEqual(ok());
        expect(deps.checkStorageByOwnerIdFetch).toHaveBeenCalledWith({ ownerId });
        expect(deps.dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: '@suite/quota-manager/ownerFetched',
                payload: {
                    walletDescriptor,
                    totalSpace: 2048,
                },
            }),
        );
        expect(deps.allocateOwnerQuota).not.toHaveBeenCalled();
    });

    it('returns QuotaManagerCommunicationFailed for non-404 storage lookup failures', async () => {
        const httpError = { type: 'HttpError' as const, code: 500, message: 'Internal error' };
        const deps = createEnsureOwnerHasAllocatedQuotaDepsMock({
            checkStorageByOwnerIdResponses: [err(httpError)],
        });

        const result = await createEnsureOwnerHasAllocatedQuota(deps)({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceStaticSessionId,
            isWriteMode: false,
        });

        expect(result).toEqual(err({ type: 'QuotaManagerCommunicationFailed', caused: httpError }));
        expect(deps.allocateOwnerQuota).not.toHaveBeenCalled();
    });

    it('delegates allocation when owner storage is missing', async () => {
        const allocateOwnerQuota = mock<AllocateOwnerQuota>(() => Promise.resolve(ok()));
        const deps = createEnsureOwnerHasAllocatedQuotaDepsMock({
            checkStorageByOwnerIdResponses: [ok({ status: 'NoQuota' })],
            patch: {
                allocateOwnerQuota,
            },
        });

        const result = await createEnsureOwnerHasAllocatedQuota(deps)({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceStaticSessionId,
            isWriteMode: true,
        });

        expect(result).toEqual(ok());
        expect(allocateOwnerQuota).toHaveBeenCalledWith({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            walletDescriptor,
            deviceId,
            isWriteMode: true,
        });
    });

    it('propagates allocation failures from allocateOwnerQuota', async () => {
        const error = QuotaManagerCommunicationFailed({ caused: { type: 'HttpError', code: 500 } });
        const allocateOwnerQuota = mock<AllocateOwnerQuota>(() => Promise.resolve(err(error)));

        const deps = createEnsureOwnerHasAllocatedQuotaDepsMock({
            checkStorageByOwnerIdResponses: [ok({ status: 'NoQuota' })],
            patch: {
                allocateOwnerQuota,
            },
        });

        const result = await createEnsureOwnerHasAllocatedQuota(deps)({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceStaticSessionId,
            isWriteMode: true,
        });

        expect(result).toEqual(err(error));
        expect(allocateOwnerQuota).toHaveBeenCalledTimes(1);
    });
});
