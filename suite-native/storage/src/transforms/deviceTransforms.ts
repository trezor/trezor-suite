import { A, pipe } from '@mobily/ts-belt';
import { createTransform } from 'redux-persist';

import { filterInconclusiveAuthenticityChecks } from '@suite-common/firmware-authenticity';
import { type AcquiredDevice, type TrezorDevice } from '@suite-common/suite-types';
import { isDeviceAcquired } from '@suite-common/suite-utils';

const serializeDevice = (device: AcquiredDevice): Omit<AcquiredDevice, 'path'> & { path: '' } => ({
    ...device,
    path: '',
    remember: true,
    temporaryRemember: false,
    connected: false,
    buttonRequests: [],
    authenticityChecks: filterInconclusiveAuthenticityChecks(device.authenticityChecks),
});

export const devicePersistTransform = createTransform<
    TrezorDevice[],
    Readonly<(Omit<TrezorDevice, 'path'> & { path: '' })[]>
>(
    inboundState =>
        pipe(
            inboundState,
            // only for type-narrowing; this is already projected into device.remember in `shouldDeviceBeRemembered`
            A.filter(isDeviceAcquired),
            A.filter(device => !!device.remember && device.temporaryRemember !== true),
            A.map(serializeDevice),
        ),
    undefined,
    { whitelist: ['devices'] },
);
