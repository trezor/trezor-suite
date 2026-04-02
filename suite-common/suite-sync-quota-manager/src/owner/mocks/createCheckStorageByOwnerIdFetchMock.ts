import { mock } from '@suite-common/dependency-injection';

import {
    type CheckStorageByOwnerIdFetch,
    type CheckStorageByOwnerIdResult,
} from '../createCheckStorageByOwnerIdFetch';

export const createCheckStorageByOwnerIdFetchMock = (responses: CheckStorageByOwnerIdResult[]) => {
    const impl = mock<CheckStorageByOwnerIdFetch>();
    responses.forEach(response => impl.mockResolvedValueOnce(response));

    return impl;
};
