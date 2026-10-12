import { createThunk } from '@suite-common/redux-utils';
import type { WithServices } from '@suite-common/redux-utils';
import type { AcquiredDevice, ReportSecurityCheckDep } from '@suite-common/suite-types';
import { getFirmwareVersion } from '@trezor/device-utils';

import { persistentDeviceDataActions } from './persistentDeviceDataActions';
import { PERSISTENT_DEVICE_DATA_MODULE_PREFIX } from './persistentDeviceDataConstants';

type ProcessDiscoveryEntropyCheckThunkParams = {
    device: AcquiredDevice;
    success: boolean;
    path: string;
};

export type ProcessDiscoveryEntropyCheckThunkDeps = WithServices<ReportSecurityCheckDep>;

/**
 * Records the result of the discovery entropy check performed by Connect during discoverAccounts
 * and reports a failure to Sentry.
 */
export const processDiscoveryEntropyCheckThunk = createThunk<
    void,
    ProcessDiscoveryEntropyCheckThunkParams,
    { extra: ProcessDiscoveryEntropyCheckThunkDeps }
>(
    `${PERSISTENT_DEVICE_DATA_MODULE_PREFIX}/processDiscoveryEntropyCheckThunk`,
    ({ device, success, path }, { dispatch, extra }) => {
        // The Sentry report will be a duplicate if this path already exists – intentionally.
        if (!success) {
            extra.services.reportSecurityCheck({
                level: 'error',
                checkType: 'Entropy discovery',
                contextData: {
                    model: device.features.internal_model,
                    revision: device.features.revision,
                    version: getFirmwareVersion(device),
                    vendor: device.features.fw_vendor,
                },
                payload: { path },
            });
        }

        dispatch(
            persistentDeviceDataActions.setDiscoveryEntropyCheckResult({
                deviceId: device.id,
                success,
                path,
            }),
        );
    },
);
