import { PORTFOLIO_TRACKER_DEVICE_ID } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';

import { backfillPortfolioTrackerUnavailableCapabilities } from '../../migrations/device/v4';

describe('backfillPortfolioTrackerUnavailableCapabilities', () => {
    it('should add unavailableCapabilities to portfolio tracker device without existing capabilities', () => {
        const oldDevices = [
            {
                id: PORTFOLIO_TRACKER_DEVICE_ID,
                type: 'acquired',
                status: 'available',
            },
        ] as unknown as TrezorDevice[];

        const migratedDevices = backfillPortfolioTrackerUnavailableCapabilities(oldDevices as any);

        expect(migratedDevices).toEqual([
            {
                id: PORTFOLIO_TRACKER_DEVICE_ID,
                type: 'acquired',
                status: 'available',
                unavailableCapabilities: {
                    evolu: 'no-support',
                },
            },
        ]);
    });

    it('should add unavailableCapabilities to portfolio tracker device with empty capabilities', () => {
        const oldDevices = [
            {
                id: PORTFOLIO_TRACKER_DEVICE_ID,
                type: 'acquired',
                unavailableCapabilities: {},
            },
        ] as unknown as TrezorDevice[];

        const migratedDevices = backfillPortfolioTrackerUnavailableCapabilities(oldDevices as any);

        expect(migratedDevices).toEqual([
            {
                id: PORTFOLIO_TRACKER_DEVICE_ID,
                type: 'acquired',
                unavailableCapabilities: {
                    evolu: 'no-support',
                },
            },
        ]);
    });

    it('should preserve existing unavailableCapabilities and add evolu for portfolio tracker', () => {
        const oldDevices = [
            {
                id: PORTFOLIO_TRACKER_DEVICE_ID,
                type: 'acquired',
                unavailableCapabilities: {
                    someOtherCapability: 'disabled',
                },
            },
        ] as unknown as TrezorDevice[];

        const migratedDevices = backfillPortfolioTrackerUnavailableCapabilities(oldDevices as any);

        expect(migratedDevices).toEqual([
            {
                id: PORTFOLIO_TRACKER_DEVICE_ID,
                type: 'acquired',
                unavailableCapabilities: {
                    someOtherCapability: 'disabled',
                    evolu: 'no-support',
                },
            },
        ]);
    });

    it('should not modify portfolio tracker if evolu capability already exists', () => {
        const oldDevices = [
            {
                id: PORTFOLIO_TRACKER_DEVICE_ID,
                type: 'acquired',
                unavailableCapabilities: {
                    evolu: 'already-set',
                    otherCapability: 'value',
                },
            },
        ] as unknown as TrezorDevice[];

        const migratedDevices = backfillPortfolioTrackerUnavailableCapabilities(oldDevices as any);

        expect(migratedDevices).toEqual(oldDevices);
    });

    it('should not modify regular devices without portfolio tracker ID', () => {
        const oldDevices = [
            {
                id: 'regular-device-id',
                type: 'acquired',
                status: 'available',
                // No unavailableCapabilities
            },
            {
                id: 'another-device',
                type: 'acquired',
                unavailableCapabilities: {
                    someCapability: 'value',
                },
            },
        ] as unknown as TrezorDevice[];

        const migratedDevices = backfillPortfolioTrackerUnavailableCapabilities(oldDevices);

        expect(migratedDevices).toEqual(oldDevices);
    });

    it('should handle mixed devices array with portfolio tracker and regular devices', () => {
        const oldDevices = [
            {
                id: 'regular-device-1',
                type: 'acquired',
            },
            {
                id: PORTFOLIO_TRACKER_DEVICE_ID,
                type: 'acquired',
            },
            {
                id: 'regular-device-2',
                unavailableCapabilities: {
                    existingCap: 'value',
                },
            },
        ] as unknown as TrezorDevice[];

        const migratedDevices = backfillPortfolioTrackerUnavailableCapabilities(oldDevices);

        expect(migratedDevices).toEqual([
            {
                id: 'regular-device-1',
                type: 'acquired',
            },
            {
                id: PORTFOLIO_TRACKER_DEVICE_ID,
                type: 'acquired',
                unavailableCapabilities: {
                    evolu: 'no-support',
                },
            },
            {
                id: 'regular-device-2',
                unavailableCapabilities: {
                    existingCap: 'value',
                },
            },
        ]);
    });
});
