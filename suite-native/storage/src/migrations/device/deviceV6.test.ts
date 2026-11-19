import { PORTFOLIO_TRACKER_DEVICE_ID, PORTFOLIO_TRACKER_DEVICE_KEY } from '@suite-common/device';
import { asDeviceKey } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';

import { backfillDeviceKeys } from './v6';

const mockSuiteDeviceNoKey = (overrides?: Parameters<typeof mockSuiteDevice>[0]) => {
    const device = mockSuiteDevice(overrides);
    // @ts-expect-error: key is intentionally deleted to test backfill logic
    delete device.key;

    return device;
};

describe('backfillDeviceKeys', () => {
    it('should add a key to a device without one', () => {
        const oldDevices = [mockSuiteDeviceNoKey({ id: 'device-1', type: 'acquired' })];

        const migratedDevices = backfillDeviceKeys(oldDevices);

        expect(migratedDevices).toEqual([
            mockSuiteDevice({ id: 'device-1', type: 'acquired', key: expect.any(String) }),
        ]);
    });

    it('should add a different key to each device', () => {
        const oldDevices = [
            mockSuiteDeviceNoKey({ id: 'device-1', type: 'acquired' }),
            mockSuiteDeviceNoKey({ id: 'device-1', type: 'acquired', instance: 1 }),
        ];

        const [firstDevice, secondDevice] = backfillDeviceKeys(oldDevices);

        expect(firstDevice?.key).toEqual(expect.any(String));
        expect(secondDevice?.key).toEqual(expect.any(String));
        expect(firstDevice?.key).not.toEqual(secondDevice?.key);
    });

    it('should keep the key of a device that already has one', () => {
        const oldDevices = [
            mockSuiteDevice({ id: 'device-1', type: 'acquired', key: asDeviceKey('existing-key') }),
        ];

        const migratedDevices = backfillDeviceKeys(oldDevices);

        expect(migratedDevices).toEqual(oldDevices);
    });

    it('should add the well-known key to the portfolio tracker device', () => {
        const oldDevices = [
            mockSuiteDeviceNoKey({ id: PORTFOLIO_TRACKER_DEVICE_ID, type: 'acquired' }),
        ];

        const migratedDevices = backfillDeviceKeys(oldDevices);

        expect(migratedDevices).toEqual([
            mockSuiteDevice({
                id: PORTFOLIO_TRACKER_DEVICE_ID,
                type: 'acquired',
                key: PORTFOLIO_TRACKER_DEVICE_KEY,
            }),
        ]);
    });
});
