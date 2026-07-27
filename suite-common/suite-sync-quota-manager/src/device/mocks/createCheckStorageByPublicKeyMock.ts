import { mock } from '@suite-common/dependency-injection';

import {
    type CheckStorageByPublicKeyFetch,
    type CheckStorageByPublicKeyResult,
} from '../createCheckStorageByPublicKeyFetch';

export const createCheckStorageByPublicKeyMock = (responses: CheckStorageByPublicKeyResult[]) => {
    const impl = mock<CheckStorageByPublicKeyFetch>();
    responses.forEach(response => impl.mockResolvedValueOnce(response));

    return impl;
};
