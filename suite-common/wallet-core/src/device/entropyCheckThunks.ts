import {
    DEVICE_MODULE_PREFIX,
    deviceActions,
    getIsIgnoredEntropyCheckError,
} from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import type { AcquiredDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect from '@trezor/connect';
import type { SerializedError } from '@trezor/connect-common/src/constants/errors';
import { getFirmwareVersion } from '@trezor/device-utils';

type FailEntropyCheckParams = {
    device: AcquiredDevice;
    error: SerializedError;
};

const failEntropyCheckThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/failEntropyCheckThunk`,
    ({ device, error }: FailEntropyCheckParams, { dispatch, extra }) => {
        const contextData = {
            model: device?.features?.internal_model,
            revision: device?.features?.revision,
            version: getFirmwareVersion(device),
            vendor: device?.features?.fw_vendor,
        };
        extra.services.reportSecurityCheck({
            level: 'error',
            checkType: 'Entropy',
            contextData,
            payload: error,
        });

        if (!getIsIgnoredEntropyCheckError(error.message)) {
            dispatch(deviceActions.setEntropyCheckResult({ deviceId: device.id, success: false }));
        }
    },
);

type ProcessEntropyCheckResultThunkParams = {
    device: AcquiredDevice;
    result: Awaited<ReturnType<typeof TrezorConnect.resetDevice>>;
};

export const processEntropyCheckResultThunk = createThunk(
    `${DEVICE_MODULE_PREFIX}/processEntropyCheckResultThunk`,
    ({ device, result }: ProcessEntropyCheckResultThunkParams, { dispatch }) => {
        if (result.success) {
            dispatch(
                deviceActions.setEntropyCheckResult({
                    deviceId: device.id,
                    success: true,
                    xpubHashes: result.payload.xpubHashes,
                }),
            );
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.error.message }));
            if (result.error.code === 'Failure_EntropyCheck') {
                dispatch(failEntropyCheckThunk({ device, error: result.error }));
            }
        }
    },
);
