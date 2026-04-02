import { mock } from '@suite-common/dependency-injection';

import {
    type TransferStorageFetch,
    type TransferStorageResult,
} from '../createTransferStorageFetch';

export const createTransferStorageMock = (responses: TransferStorageResult[]) => {
    const impl = mock<TransferStorageFetch>();
    responses.forEach(response => impl.mockResolvedValueOnce(response));

    return impl;
};
