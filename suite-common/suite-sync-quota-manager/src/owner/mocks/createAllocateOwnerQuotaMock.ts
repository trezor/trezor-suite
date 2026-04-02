import { mock } from '@suite-common/dependency-injection';

import { type AllocateOwnerQuota } from '../createAllocateOwnerQuota';

type AllocateOwnerQuotaResult = Awaited<ReturnType<AllocateOwnerQuota>>;

export const createAllocateOwnerQuotaMock = (responses: AllocateOwnerQuotaResult[]) => {
    const impl = mock<AllocateOwnerQuota>();
    responses.forEach(response => impl.mockResolvedValueOnce(response));

    return impl;
};
