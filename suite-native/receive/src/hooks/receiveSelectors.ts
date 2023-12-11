import { pipe, A } from '@mobily/ts-belt';

import { DeviceRootState, selectDeviceButtonRequestsCodes } from '@suite-common/wallet-core';

export const hasReceiveAddressButtonRequest = (state: DeviceRootState) =>
    pipe(
        selectDeviceButtonRequestsCodes(state),
        A.some(code => code === 'ButtonRequest_Address'),
    );
