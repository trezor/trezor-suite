import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    CheckDeviceAuthenticityThunkResult,
    deviceAuthenticityActions,
} from '@suite-common/device-authenticity';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { DeviceAuthenticityCheckResult, EventType, analytics } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { useTranslate } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

export const useDeviceAuthenticityCheck = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const { showToast } = useToast();
    const allowDebugKeys = useFeatureFlag(FeatureFlag.IsDebugKeysAllowed);

    const device = useSelector(selectSelectedDevice);
    const isDeviceBootloaderUnlocked = !!device && !device?.features?.bootloader_locked;
    const reportCheckResult = useCallback(
        (result: DeviceAuthenticityCheckResult) =>
            analytics.report({
                type: EventType.DeviceSettingsAuthenticityCheck, // TODO: fix for onboarding
                payload: { result },
            }),
        // TODO: report compromised, expired and failed to Sentry including the error
        [],
    );

    const createStoredResult = useCallback(
        (payload: CheckDeviceAuthenticityThunkResult) => {
            if (
                payload?.error === 'CA_PUBKEY_NOT_FOUND' &&
                'configExpired' in payload &&
                payload?.configExpired
            ) {
                // CA_PUBKEY_NOT_FOUND with configExpired is temporarily allowed and just logged to Sentry
                reportCheckResult('configExpired');

                return {
                    ...payload,
                    valid: true,
                };
            }

            if (isDeviceBootloaderUnlocked) {
                return {
                    valid: false,
                    error: payload?.error ?? 'Bootloader unlocked!',
                };
            }

            return payload;
        },
        [isDeviceBootloaderUnlocked, reportCheckResult],
    );

    const handleDeviceAccessError = useCallback(
        (error: string) => {
            showToast({
                variant: 'error',
                message: translate('moduleDeviceSettings.authenticity.toast.failed', { error }),
            });
            reportCheckResult('failed'); // TODO: send deviceAccessResponse.error to Sentry
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
                    reportCheckResult('failed');
            }
        },
        [isDeviceBootloaderUnlocked, navigation, reportCheckResult, showToast, translate],
    );

    const checkDeviceAuthenticity = useCallback(
        async (handleSuccess: () => void) => {
            if (!device) {
                handleDeviceAccessError('Device is not connected');

                return;
            }

            // Clear previous result
            dispatch(deviceAuthenticityActions.result({ device, result: undefined }));

            const deviceAccessResponse = await requestPrioritizedDeviceAccess({
                deviceCallback: () =>
                    TrezorConnect.authenticateDevice({
                        device: {
                            path: device.path,
                        },
                        allowDebugKeys,
                    }),
            });

            if (!deviceAccessResponse.success) {
                handleDeviceAccessError(deviceAccessResponse.error);

                return;
            }

            const result = deviceAccessResponse.payload;

            if (!result.success) {
                const { error, code } = result.payload;
                handleError(error, code);
            }

            const storedResult: CheckDeviceAuthenticityThunkResult = createStoredResult(
                result.payload,
            );

            dispatch(deviceAuthenticityActions.result({ device, result: storedResult }));

            if (storedResult?.valid === false) {
                reportCheckResult('compromised');
            } else if (result.success) {
                handleSuccess();
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
