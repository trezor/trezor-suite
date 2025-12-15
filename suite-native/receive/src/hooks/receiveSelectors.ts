import { A, pipe } from '@mobily/ts-belt';

import type { DeviceRootState } from '@suite-common/wallet-core';
import { selectDeviceButtonRequestsCodes } from '@suite-common/wallet-core';

export const hasReceiveAddressButtonRequest = (state: DeviceRootState) =>
    pipe(
        selectDeviceButtonRequestsCodes(state),
        A.some(code => code === 'ButtonRequest_Address'),
    );
