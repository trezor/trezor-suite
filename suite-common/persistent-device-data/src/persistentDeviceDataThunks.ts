import type { AcquiredDevice, ReportSecurityCheckDep } from '@suite-common/suite-types';
import { DeviceModelInternal, getFirmwareVersion } from '@trezor/device-utils';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { persistentDeviceDataActions } from './persistentDeviceDataActions';
import { PERSISTENT_DEVICE_DATA_MODULE_PREFIX } from './persistentDeviceDataConstants';
import type { PersistentDeviceDataRootState } from './persistentDeviceDataReducer';
import { selectVerifiedModelByDeviceId } from './persistentDeviceDataSelectors';

/**
 * Whether a model has the Discovery Entropy Check enabled.
 * The check is always performed & reported to Sentry, but if disabled, the result won't be persisted → UI not shown.
 */
const DISCOVERY_ENTROPY_CHECK_ENABLED_BY_MODEL: Record<DeviceModelInternal, boolean> = {
    [DeviceModelInternal.UNKNOWN]: true,
    [DeviceModelInternal.T1B1]: true,
    [DeviceModelInternal.T2T1]: true,
    [DeviceModelInternal.T2B1]: true,
    [DeviceModelInternal.T3B1]: false,
    [DeviceModelInternal.T3T1]: false,
    [DeviceModelInternal.T3W1]: false,
};

type ProcessDiscoveryEntropyCheckThunkParams = {
    device: AcquiredDevice;
    success: boolean;
    path: string;
};

export type ProcessDiscoveryEntropyCheckThunkState = PersistentDeviceDataRootState;

export type ProcessDiscoveryEntropyCheckThunkDeps = WithServices<ReportSecurityCheckDep>;

/**
 * Records the result of the discovery entropy check performed by Connect during discoverAccounts
 * and reports a failure to Sentry.
 */
export const processDiscoveryEntropyCheckThunk = createThunk<
    void,
    ProcessDiscoveryEntropyCheckThunkParams,
    { state: ProcessDiscoveryEntropyCheckThunkState; extra: ProcessDiscoveryEntropyCheckThunkDeps }
>(
    `${PERSISTENT_DEVICE_DATA_MODULE_PREFIX}/processDiscoveryEntropyCheckThunk`,
    ({ device, success, path }, { dispatch, getState, extra }) => {
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

        // Mark the Discovery Entropy check as failure, but not for models T3xx, if they have been verified as such.
        const verifiedInternalModel = selectVerifiedModelByDeviceId(getState(), device.id);
        const isDisabledForModel =
            verifiedInternalModel !== null &&
            DISCOVERY_ENTROPY_CHECK_ENABLED_BY_MODEL[verifiedInternalModel] === false;
        if (isDisabledForModel && !success) return; // Failure is not persisted, but success is.

        dispatch(
            persistentDeviceDataActions.setDiscoveryEntropyCheckResult({
                deviceId: device.id,
                success,
                path,
            }),
        );
    },
);
