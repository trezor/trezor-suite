import { PORTFOLIO_TRACKER_DEVICE_ID, PORTFOLIO_TRACKER_DEVICE_KEY } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';

import { backfillDeviceKeys } from './v6';

describe('backfillDeviceKeys', () => {
    it('should add a key to a device without one', () => {
        const oldDevices = [{ id: 'device-1', type: 'acquired' }] as unknown as TrezorDevice[];

        const migratedDevices = backfillDeviceKeys(oldDevices);

        expect(migratedDevices).toEqual([
            { id: 'device-1', type: 'acquired', key: expect.stringMatching(/.+/) },
        ]);
    });

    it('should add a different key to each device', () => {
        const oldDevices = [
            { id: 'device-1', type: 'acquired' },
            { id: 'device-1', type: 'acquired', instance: 1 },
        ] as unknown as TrezorDevice[];

        const [firstDevice, secondDevice] = backfillDeviceKeys(oldDevices);

        expect(firstDevice?.key).toEqual(expect.stringMatching(/.+/));
        expect(secondDevice?.key).toEqual(expect.stringMatching(/.+/));
        expect(firstDevice?.key).not.toEqual(secondDevice?.key);
    });

    it('should keep the key of a device that already has one', () => {
        const oldDevices = [
            { id: 'device-1', type: 'acquired', key: 'existing-key' },
        ] as unknown as TrezorDevice[];

        const migratedDevices = backfillDeviceKeys(oldDevices);

        expect(migratedDevices).toEqual(oldDevices);
    });

    it('should add the well-known key to the portfolio tracker device', () => {
        const oldDevices = [
            { id: PORTFOLIO_TRACKER_DEVICE_ID, type: 'acquired' },
        ] as unknown as TrezorDevice[];

        const migratedDevices = backfillDeviceKeys(oldDevices);

        expect(migratedDevices).toEqual([
            {
                id: PORTFOLIO_TRACKER_DEVICE_ID,
                type: 'acquired',
                key: PORTFOLIO_TRACKER_DEVICE_KEY,
            },
        ]);
    });
});
