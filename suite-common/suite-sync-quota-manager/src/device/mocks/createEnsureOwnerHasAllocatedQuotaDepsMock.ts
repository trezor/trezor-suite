import { createMockDeps } from '@suite-common/dependency-injection';
import { ok } from '@trezor/type-utils';

import { type CheckStorageByOwnerIdResult } from '../../owner/createCheckStorageByOwnerIdFetch';
import { type EnsureOwnerHasAllocatedQuotaDeps } from '../../owner/createEnsureOwnerHasAllocatedQuota';
import { createAllocateOwnerQuotaMock } from '../../owner/mocks/createAllocateOwnerQuotaMock';
import { createCheckStorageByOwnerIdFetchMock } from '../../owner/mocks/createCheckStorageByOwnerIdFetchMock';

type CreateEnsureOwnerHasAllocatedQuotaDepsMockParams = {
    checkStorageByOwnerIdResponses: CheckStorageByOwnerIdResult[];
    patch?: Partial<EnsureOwnerHasAllocatedQuotaDeps>;
};

export const createEnsureOwnerHasAllocatedQuotaDepsMock = ({
    checkStorageByOwnerIdResponses,
    patch = {},
}: CreateEnsureOwnerHasAllocatedQuotaDepsMockParams) =>
    createMockDeps<EnsureOwnerHasAllocatedQuotaDeps>({
        allocateOwnerQuota: createAllocateOwnerQuotaMock([ok()]),
        checkStorageByOwnerIdFetch: createCheckStorageByOwnerIdFetchMock(
            checkStorageByOwnerIdResponses,
        ),
        dispatch: jest.fn(),
        ...patch,
    });
