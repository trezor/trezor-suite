import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { isDeviceAuthenticityValid } from '@suite-common/device-authenticity';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { type StoredAuthenticateDeviceResult } from '@suite-common/suite-types';
import { type DeviceAuthenticityCheckResult, events } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { useTranslate } from '@suite-native/intl';
import { captureSentryException, withSentryScope } from '@suite-native/sentry';
import { useAnalytics } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';
import TrezorConnect, { type AuthenticateDeviceResult, type Response } from '@trezor/connect';
import { isArrayMember } from '@trezor/utils';

type RawResult = Awaited<Response<AuthenticateDeviceResult>>;

type CheckDeviceAuthenticityParams = {
    handleSuccess: () => void;
    handleFailure: () => void;
};

export const useDeviceAuthenticityCheck = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const { showToast } = useToast();
    const allowDebugKeys = useFeatureFlag(FeatureFlag.IsDebugKeysAllowed);
    const isOptigaRemotelyDisabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureDisabled(state, Feature.deviceAuthenticityCheckOptiga),
    );
    const isTropicRemotelyDisabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureDisabled(state, Feature.deviceAuthenticityCheckTropic),
    );
    const isMCURemotelyDisabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureDisabled(state, Feature.deviceAuthenticityCheckMCU),
    );
    const analytics = useAnalytics();
    const device = useSelector(selectSelectedDevice);
    const isDeviceBootloaderUnlocked = !!device && !device?.features?.bootloader_locked;
    const reportCheckResult = useCallback(
        (
            result: DeviceAuthenticityCheckResult,
            error?: string,
            payload?: StoredAuthenticateDeviceResult,
        ) => {
            analytics.report({
                type: events.deviceSettingsAuthenticityCheckEvent.name,
                payload: { result },
            });
            if (isArrayMember(result, ['compromised', 'failed'])) {
                const sentryLevelMap = { compromised: 'fatal', failed: 'error' } as const;
                const sentryLevel = sentryLevelMap[result];

                withSentryScope(scope => {
                    scope.setLevel(sentryLevel);
                    scope.setTag('deviceAuthenticityResult', result);
                    scope.setTag('deviceAuthenticityError', error);

                    const exceptionForSentry = new Error(
                        `Device authenticity ${result}!\n${JSON.stringify(payload)}`,
                    );
                    exceptionForSentry.name = 'reportCheckFail'; // Custom issue title
                    captureSentryException(exceptionForSentry, scope);
                });
            }
        },
        [analytics],
    );

    const createStoredResult = useCallback(
        (result: RawResult): StoredAuthenticateDeviceResult => {
            // Error from the TrezorConnect call itself. It is considered as valid: false if the cause was bootloader unlocked.
            // Otherwise it may be cancel on device (must not be considered device compromised), or a transport error, etc.
            if (!result.success) {
                return isDeviceBootloaderUnlocked
                    ? { valid: false, error: result.error.message }
                    : undefined;
            }

            const isOverallValid = isDeviceAuthenticityValid({
                result: result.payload,
                isOptigaRemotelyDisabled,
                isTropicRemotelyDisabled,
                isMCURemotelyDisabled,
            });

            return { valid: isOverallValid, ...result.payload };
        },
        [
            isDeviceBootloaderUnlocked,
            isOptigaRemotelyDisabled,
            isTropicRemotelyDisabled,
            isMCURemotelyDisabled,
        ],
    );

    const handleDeviceAccessError = useCallback(
        (error: string) => {
            showToast({
                variant: 'error',
                message: translate('moduleDeviceSettings.authenticity.toast.failed', { error }),
            });
            reportCheckResult('failed', error);
        },
        [reportCheckResult, showToast, translate],
    );

    const handleError = useCallback(
        (error: string, errorCode?: string) => {
            if (isDeviceBootloaderUnlocked) {
                // Error code is Failure_ProcessError, but  Not all Failure_ProcessError codes mean the bootloader is unlocked,
                // so this custom condition prevents false positives for that case.
                showToast({
                    variant: 'error',
                    message: translate('moduleDeviceSettings.authenticity.toast.error', {
                        error,
                    }),
                });
                // Unlocked bootloader is reported as compromised (valid === false) from the checkDeviceAuthenticity

                return;
            }

            switch (errorCode) {
                case 'Failure_ActionCancelled':
                case 'Failure_PinCancelled': // PIN entry cancelled on T3T1
                    navigation.goBack();
                    showToast({
                        variant: 'info',
                        message: translate('moduleDeviceSettings.authenticity.toast.canceled'),
                    });
                    reportCheckResult('cancelled');
                    break;
                default:
                    navigation.goBack();
                    showToast({
                        variant: 'error',
                        message: translate('moduleDeviceSettings.authenticity.toast.error', {
                            error,
                        }),
                    });
                    reportCheckResult('failed', error);
            }
        },
        [isDeviceBootloaderUnlocked, navigation, reportCheckResult, showToast, translate],
    );

    const checkDeviceAuthenticity = useCallback(
        async ({ handleSuccess, handleFailure }: CheckDeviceAuthenticityParams) => {
            if (!device) {
                handleDeviceAccessError('Device is not connected');

                return;
            }

            // Clear previous result
            dispatch(
                deviceActions.setDeviceAuthenticityResult({
                    deviceId: device.id,
                    result: undefined,
                }),
            );

            const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
                TrezorConnect.authenticateDevice({
                    device: {
                        path: device.path,
                    },
                    allowDebugKeys,
                }),
            );

            if (!deviceAccessResponse.success) {
                handleDeviceAccessError(deviceAccessResponse.error);

                return;
            }

            const result = deviceAccessResponse.payload;

            if (!result.success) {
                const { message, code } = result.error;
                handleError(message, code);
            }

            const storedResult: StoredAuthenticateDeviceResult = createStoredResult(result);

            dispatch(
                deviceActions.setDeviceAuthenticityResult({
                    deviceId: device.id,
                    result: storedResult,
                }),
            );

            if (storedResult?.valid === false) {
                handleFailure();
                if ('optigaResult' in storedResult && storedResult.optigaResult.error) {
                    reportCheckResult('compromised', storedResult.optigaResult.error, storedResult);
                }
                if ('tropicResult' in storedResult && storedResult.tropicResult?.error) {
                    reportCheckResult('compromised', storedResult.tropicResult.error, storedResult);
                }
                if ('mcuResult' in storedResult && storedResult.mcuResult?.error) {
                    reportCheckResult('compromised', storedResult.mcuResult.error, storedResult);
                }
            } else if (result.success) {
                handleSuccess();
                reportCheckResult('successful');
            }
        },
        [
            allowDebugKeys,
            device,
            dispatch,
            createStoredResult,
            handleDeviceAccessError,
            handleError,
            reportCheckResult,
        ],
    );

    return {
        checkDeviceAuthenticity,
    };
};
