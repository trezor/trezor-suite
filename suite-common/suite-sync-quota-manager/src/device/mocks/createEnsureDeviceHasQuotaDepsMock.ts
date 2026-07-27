import { createMockDeps } from '@suite-common/dependency-injection';

import { type CheckStorageByPublicKeyResult } from '../createCheckStorageByPublicKeyFetch';
import { type EnsureDeviceHasQuotaDeps } from '../createEnsureDeviceHasQuota';
import { createCheckStorageByPublicKeyMock } from './createCheckStorageByPublicKeyMock';
import { createRegisterDeviceMock } from './createRegisterDeviceMock';

type RegisterDeviceResult = Awaited<ReturnType<EnsureDeviceHasQuotaDeps['registerDevice']>>;

type CreateEnsureDeviceHasQuotaDepsMockParams = {
    checkStorageByPublicKeyResponses: CheckStorageByPublicKeyResult[];
    registerDeviceResponses: RegisterDeviceResult[];
    patch?: Partial<EnsureDeviceHasQuotaDeps>;
};

export const createEnsureDeviceHasQuotaDepsMock = ({
    checkStorageByPublicKeyResponses,
    registerDeviceResponses,
    patch = {},
}: CreateEnsureDeviceHasQuotaDepsMockParams) =>
    createMockDeps<EnsureDeviceHasQuotaDeps>({
        checkStorageByPublicKeyFetch: createCheckStorageByPublicKeyMock(
            checkStorageByPublicKeyResponses,
        ),
        dispatch: jest.fn(),
        registerDevice: createRegisterDeviceMock(registerDeviceResponses),
        ...patch,
    });
