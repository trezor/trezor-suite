import { selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';

import { type SignVerifyRootState } from './signVerifyRootState';

export const getSignVerifyDevice = (getState: () => SignVerifyRootState): TrezorDevice => {
    const device = selectSelectedDevice(getState());

    if (!device || !device.connected || !device.available) {
        throw new Error('Device not found');
    }

    return device;
};
