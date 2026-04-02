import { mock } from '@suite-common/dependency-injection';

import { type EnsureOwnerHasAllocatedQuota } from '../createEnsureOwnerHasAllocatedQuota';

type EnsureOwnerHasAllocatedQuotaResult = Awaited<ReturnType<EnsureOwnerHasAllocatedQuota>>;

export const createEnsureOwnerHasAllocatedQuotaMock = (
    responses: EnsureOwnerHasAllocatedQuotaResult[],
) => {
    const impl = mock<EnsureOwnerHasAllocatedQuota>();
    responses.forEach(response => impl.mockResolvedValueOnce(response));

    return impl;
};
