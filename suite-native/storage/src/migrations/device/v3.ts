import { type TrezorDevice } from '@suite-common/suite-types';
import { isDeviceAcquired } from '@suite-common/suite-utils';

export const backfillDeviceAuthenticityChecks = (devices: TrezorDevice[]): TrezorDevice[] =>
    devices.map(device => {
        if (isDeviceAcquired(device) && !!device.authenticityChecks) return device;

        return {
            ...device,
            authenticityChecks: {
                firmwareRevision: null,
                firmwareHash: null,
            },
        };
    });
