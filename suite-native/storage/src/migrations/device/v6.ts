import { PORTFOLIO_TRACKER_DEVICE_ID, PORTFOLIO_TRACKER_DEVICE_KEY } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { generateDeviceKey } from '@suite-common/suite-utils';

export const backfillDeviceKeys = (devices: TrezorDevice[]): TrezorDevice[] =>
    devices.map(device => {
        if (device.key) return device;

        return {
            ...device,
            key:
                device.id === PORTFOLIO_TRACKER_DEVICE_ID
                    ? PORTFOLIO_TRACKER_DEVICE_KEY
                    : generateDeviceKey(),
        };
    });
