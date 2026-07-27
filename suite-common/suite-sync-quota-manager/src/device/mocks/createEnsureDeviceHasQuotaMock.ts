import { mock } from '@suite-common/dependency-injection';

import { type EnsureDeviceHasQuota } from '../createEnsureDeviceHasQuota';

type EnsureDeviceHasQuotaResult = Awaited<ReturnType<EnsureDeviceHasQuota>>;

export const createEnsureDeviceHasQuotaMock = (responses: EnsureDeviceHasQuotaResult[]) => {
    const impl = mock<EnsureDeviceHasQuota>();
    responses.forEach(response => impl.mockResolvedValueOnce(response));

    return impl;
};
