import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import {
    FirmwareUpdateResult,
    useFirmwareInstallation,
    UseFirmwareInstallationParams,
} from '@suite-common/firmware';
import { TxKeyPath, useTranslate } from '@suite-native/intl';

import { nativeFirmwareActions } from '../nativeFirmwareSlice';

// If progress doesn't change for 1 minute
const MAYBE_STUCKED_TIMEOUT = 1 * 60 * 1000; // 1 minute

export const useFirmware = (params: UseFirmwareInstallationParams) => {
    const dispatch = useDispatch();
    const {
        firmwareUpdate: firmwareUpdateCommon,
        confirmOnDevice: confirmOnDeviceCommon,
        operation,
        status,
        error,
        progress,
        ...firmwareInstallation
    } = useFirmwareInstallation(params);
    const { translate } = useTranslate();
    const [mayBeStucked, setMayBeStucked] = useState(false);
    const mayBeStuckedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setIsFirmwareInstallationRunning = useCallback(
        (isRunning: boolean) => {
            dispatch(nativeFirmwareActions.setIsFirmwareInstallationRunning(isRunning));
        },
        [dispatch],
    );

    const resetMayBeStuckedTimeout = useCallback(() => {
        if (mayBeStuckedTimeout.current) {
            clearTimeout(mayBeStuckedTimeout.current);
        }
        setMayBeStucked(false);
    }, []);

    const setMayBeStuckedTimeout = useCallback(() => {
        resetMayBeStuckedTimeout();
        mayBeStuckedTimeout.current = setTimeout(() => {
            setMayBeStucked(true);
        }, MAYBE_STUCKED_TIMEOUT);
    }, [resetMayBeStuckedTimeout]);

    useEffect(() => {
        if (status === 'started' && progress < 100) {
            setMayBeStuckedTimeout();
        }

        return () => {
            resetMayBeStuckedTimeout();
        };
    }, [progress, status, setMayBeStuckedTimeout, resetMayBeStuckedTimeout]);

    const firmwareUpdate = useCallback(async () => {
        const result = await firmwareUpdateCommon({ ignoreBaseUrl: true })
            .unwrap()
            .catch(error => {
                if ((error as FirmwareUpdateResult)?.connectResponse?.success !== undefined) {
                    // This is a firmware update error that is handled by us and we expect promise not to be rejected (for example user cancelled the action on device)
                    return error as FirmwareUpdateResult;
                }
                throw error;
            })
            .then(({ connectResponse }) => {
                return connectResponse;
            })
            .finally(() => {
                resetMayBeStuckedTimeout();
            });

        return result;
    }, [firmwareUpdateCommon, resetMayBeStuckedTimeout]);

    const confirmOnDevice =
        confirmOnDeviceCommon ||
        // This is needed for firmware reinstall to show Confirm on device correctly
        // @ts-expect-error types are not correct here, IDK why
        firmwareInstallation.uiEvent?.payload?.code === 'ButtonRequest_Other';

    const translatedText = useMemo(() => {
        let text: { title: TxKeyPath; subtitle?: TxKeyPath } = {
            title: 'moduleDeviceSettings.firmware.firmwareUpdateProgress.initializing.title',
        };

        const isInitialState = (status === 'started' && operation === null) || status === 'initial';

        if (status === 'error') {
            text = {
                title: 'moduleDeviceSettings.firmware.firmwareUpdateProgress.error.title',
            };
        } else if (isInitialState && !confirmOnDevice) {
            text = {
                title: 'moduleDeviceSettings.firmware.firmwareUpdateProgress.initializing.title',
            };
        } else if (isInitialState) {
            text = {
                title: 'moduleDeviceSettings.firmware.firmwareUpdateProgress.confirming.title',
            };
        } else if (operation === 'validating') {
            text = {
                title: 'moduleDeviceSettings.firmware.firmwareUpdateProgress.validating.title',
            };
        } else if (operation === 'restarting') {
            text = {
                title: 'moduleDeviceSettings.firmware.firmwareUpdateProgress.restarting.title',
            };
        } else if (operation === 'completed' || status === 'done') {
            text = {
                title: 'moduleDeviceSettings.firmware.firmwareUpdateProgress.completed.title',
                subtitle: 'moduleDeviceSettings.firmware.firmwareUpdateProgress.completed.subtitle',
            };
        } else if (operation === 'installing') {
            text = {
                title: 'moduleDeviceSettings.firmware.firmwareUpdateProgress.installing.title',
                subtitle:
                    'moduleDeviceSettings.firmware.firmwareUpdateProgress.installing.subtitle',
            };
        }

        return {
            title: translate(text.title),
            subtitle: text.subtitle ? translate(text.subtitle) : error,
        };
    }, [operation, status, error, confirmOnDevice, translate]);

    return {
        ...firmwareInstallation,
        setIsFirmwareInstallationRunning,
        firmwareUpdate,
        confirmOnDevice,
        translatedText,
        operation,
        status,
        error,
        mayBeStucked,
        progress,
    };
};
