import { mock } from '@suite-common/dependency-injection';

import {
    type RegisterDeviceFetch,
    type RegisterDeviceFetchResult,
} from '../device/createRegisterDeviceFetch';

export const createRegisterStorageMock = (responses: RegisterDeviceFetchResult[]) => {
    const impl = mock<RegisterDeviceFetch>();
    responses.forEach(response => impl.mockResolvedValueOnce(response));

    return impl;
};
