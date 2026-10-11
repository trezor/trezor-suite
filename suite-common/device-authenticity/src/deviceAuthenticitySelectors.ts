import { selectDeviceModel, selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';

import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from './deviceAuthenticityConstants';

export const selectIsDeviceAuthenticityCheckSupported = createWeakMapSelector(
    [selectIsPortfolioTrackerDevice, selectDeviceModel],
    (isPortfolioTrackerDevice, deviceModel) =>
        isPortfolioTrackerDevice ||
        (!!deviceModel && SUPPORTS_DEVICE_AUTHENTICITY_CHECK[deviceModel]),
);
