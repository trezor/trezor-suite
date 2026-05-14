import {
    type DeviceRootState,
    selectDeviceFirmwareRevision,
    selectDeviceFirmwareVersion,
    selectDeviceInternalModel,
    selectIsDeviceUsingPassphrase,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { getSuiteVersion } from '@trezor/env-utils';
import { HELP_CENTER_WHAT_IS_TREZOR_SUITE_URL, withOpenChat, withUtmParams } from '@trezor/urls';

import { type SupportChatUtmParams } from './types';

const createMemoizedSelector = createWeakMapSelector.withTypes<DeviceRootState>();

export const selectSupportChatUrl = createMemoizedSelector(
    [
        selectDeviceInternalModel,
        selectDeviceFirmwareVersion,
        selectDeviceFirmwareRevision,
        selectIsDeviceUsingPassphrase,
        selectIsPortfolioTrackerDevice,
        (_state, isSystemInfoShared) => isSystemInfoShared,
    ],
    (
        deviceModel,
        firmwareVersion,
        firmwareRevision,
        isDeviceUsingPassphrase,
        isPortfolioTrackerDevice,
        isSystemInfoShared,
    ) => {
        const supportChatUrl = withOpenChat(HELP_CENTER_WHAT_IS_TREZOR_SUITE_URL);

        if (!isSystemInfoShared) {
            return supportChatUrl;
        }

        const deviceUtmParams: SupportChatUtmParams = { utm_app: getSuiteVersion() };

        if (!isPortfolioTrackerDevice) {
            if (deviceModel) {
                deviceUtmParams.utm_model = deviceModel;
            }
            if (firmwareVersion) {
                deviceUtmParams.utm_fw = firmwareVersion;
            }
            if (firmwareRevision) {
                deviceUtmParams.utm_rev = firmwareRevision;
            }
            deviceUtmParams.utm_passphrase = isDeviceUsingPassphrase ? 'true' : 'false';
        }

        return withUtmParams(supportChatUrl, deviceUtmParams);
    },
);
