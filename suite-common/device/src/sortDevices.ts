import { type TrezorDevice } from '@suite-common/suite-types';
import { sortByTimestamp } from '@suite-common/suite-utils';

import { PORTFOLIO_TRACKER_DEVICE_ID } from './deviceConstants';

// Sort devices by timestamp and put Portfolio Tracker device at the end.
export const sortDevices = (devices: TrezorDevice[]) => {
    const sortedDevicesByTimestamp = sortByTimestamp([...devices]);

    const containsPortfolioTrackerDevices = sortedDevicesByTimestamp.filter(
        device => device.id === PORTFOLIO_TRACKER_DEVICE_ID,
    );

    return sortedDevicesByTimestamp
        .filter(device => device.id !== PORTFOLIO_TRACKER_DEVICE_ID)
        .concat(containsPortfolioTrackerDevices);
};
