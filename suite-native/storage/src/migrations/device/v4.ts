import { PORTFOLIO_TRACKER_DEVICE_ID } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';

export const backfillPortfolioTrackerUnavailableCapabilities = (
    devices: TrezorDevice[],
): TrezorDevice[] =>
    devices?.map(device => {
        if (device.id !== PORTFOLIO_TRACKER_DEVICE_ID) return device;

        return {
            ...device,
            unavailableCapabilities: {
                ...device.unavailableCapabilities,
                ...(device.unavailableCapabilities?.evolu === undefined
                    ? { evolu: 'no-support' as const }
                    : {}),
            },
        };
    });
