import { type deviceActions } from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import { type StoredAuthenticateDeviceResult, type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect from '@trezor/connect';

import { isDeviceAuthenticityValid } from './utils';

const ACTION_PREFIX = '@device-authenticity';

type CheckDeviceAuthenticityThunkParams = {
    /**
     * The device to check. Named by the caller rather than taken from the selection: the result is
     * stored under this device's id and read back by it, so a caller showing one device while the
     * check ran on another would look up a result that was never filed.
     */
    device: TrezorDevice;
    allowDebugKeys: boolean;
    skipSuccessToast?: boolean;
};

type CheckDeviceAuthenticityThunkState = MessageSystemRootState;

export const checkDeviceAuthenticityThunk = createThunk<
    StoredAuthenticateDeviceResult,
    CheckDeviceAuthenticityThunkParams,
    {
        rejectValue: StoredAuthenticateDeviceResult;
        state: CheckDeviceAuthenticityThunkState;
    }
>(
    `${ACTION_PREFIX}/checkDeviceAuthenticity`,
    async (
        { device, allowDebugKeys, skipSuccessToast },
        { dispatch, getState, fulfillWithValue, rejectWithValue },
    ) => {
        const result = await TrezorConnect.authenticateDevice({
            device: { path: device.path },
            allowDebugKeys,
        });

        // error from the TrezorConnect call itself (e.g. device cannot perform the check)
        if (!result.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `Unable to validate device: ${result.error.message}`,
                }),
            );
            const isDeviceBootloaderUnlocked = device?.features?.bootloader_locked !== true;
            const storedResult = isDeviceBootloaderUnlocked
                ? // error can be because bootloader is unlocked (definite cause of failure, should persist)
                  { valid: false, error: result.error.message }
                : // or internal error (then skip the check by storing undefined)
                  undefined;
            dispatch(
                deviceActions.setDeviceAuthenticityResult({
                    deviceId: device.id,
                    result: storedResult,
                }),
            );

            return rejectWithValue(storedResult);
        }
        const isOptigaRemotelyDisabled = selectIsFeatureDisabled(
            getState(),
            Feature.deviceAuthenticityCheckOptiga,
        );
        const isTropicRemotelyDisabled = selectIsFeatureDisabled(
            getState(),
            Feature.deviceAuthenticityCheckTropic,
        );
        const isMCURemotelyDisabled = selectIsFeatureDisabled(
            getState(),
            Feature.deviceAuthenticityCheckMCU,
        );
        const isOverallValid = isDeviceAuthenticityValid({
            result: result.payload,
            isOptigaRemotelyDisabled,
            isTropicRemotelyDisabled,
            isMCURemotelyDisabled,
        });
        const storedResult = { valid: isOverallValid, ...result.payload };

        // successful TrezorConnect call, but the signature authenticity validation failed
        if (!isOverallValid) {
            // to keep the notification short, display only the first error that failed
            const error =
                result.payload.optigaResult.error ??
                result.payload.tropicResult?.error ??
                result.payload.mcuResult?.error;
            dispatch(
                notificationsActions.addToast({
                    type: 'device-authenticity-error',
                    error: `Device is not authentic: ${error}`,
                }),
            );

            dispatch(
                deviceActions.setDeviceAuthenticityResult({
                    deviceId: device.id,
                    result: storedResult,
                }),
            );

            return rejectWithValue(storedResult);
        }

        // successful TrezorConnect call and signature is authentic
        if (!skipSuccessToast) {
            dispatch(notificationsActions.addToast({ type: 'device-authenticity-success' }));
        }
        dispatch(
            deviceActions.setDeviceAuthenticityResult({
                deviceId: device.id,
                result: storedResult,
            }),
        );

        return fulfillWithValue(storedResult);
    },
);
