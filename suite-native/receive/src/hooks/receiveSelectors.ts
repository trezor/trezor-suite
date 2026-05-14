import { A, pipe } from '@mobily/ts-belt';

import { type DeviceRootState, selectDeviceButtonRequestsCodes } from '@suite-common/device';

export const hasReceiveAddressButtonRequest = (state: DeviceRootState) =>
    pipe(
        selectDeviceButtonRequestsCodes(state),
        A.some(code => code === 'ButtonRequest_Address'),
    );
