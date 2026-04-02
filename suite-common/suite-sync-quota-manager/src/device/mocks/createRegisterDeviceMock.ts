import { mock } from '@suite-common/dependency-injection';

import { type RegisterDevice } from '../createRegisterDevice';

type RegisterDeviceResult = Awaited<ReturnType<RegisterDevice>>;

export const createRegisterDeviceMock = (responses: RegisterDeviceResult[]) => {
    const impl = mock<RegisterDevice>();
    responses.forEach(response => impl.mockResolvedValueOnce(response));

    return impl;
};
