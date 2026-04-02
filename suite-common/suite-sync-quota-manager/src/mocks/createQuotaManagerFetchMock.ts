import { mock } from '@suite-common/dependency-injection';

import { type QuotaManagerFetch, type QuotaManagerFetchResult } from '../quotaManagerFetch';

export const createQuotaManagerFetchMock = (responses: QuotaManagerFetchResult[]) => {
    const impl = mock<QuotaManagerFetch>();
    responses.forEach(response => impl.mockResolvedValueOnce(response));

    return impl;
};
