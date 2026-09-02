import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { openModal } from '@suite/modal';
import { type SuiteSettingsRootState, selectIsEntropyCheckEnabled } from '@suite/settings';
import {
    type DeviceRootState,
    selectSelectedDevice,
    selectSimulatedEntropyCheckFail,
} from '@suite-common/device';
import { FIRMWARE_MODULE_PREFIX } from '@suite-common/firmware';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import { type ReportSecurityCheckDep } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { processEntropyCheckResultThunk } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { type ERRORS } from '@trezor/connect-common/src/constants';

import {
    DEFAULT_PASSPHRASE_PROTECTION,
    DEFAULT_SKIP_BACKUP,
    DEFAULT_STRENGTH,
} from 'src/constants/suite/device';

type ApplySettingsThunkState = DeviceRootState;

export const applySettingsThunk =
    (params: Parameters<typeof TrezorConnect.applySettings>[0]) =>
    async (dispatch: Dispatch<UnknownAction>, getState: () => ApplySettingsThunkState) => {
        const device = selectSelectedDevice(getState());
        if (!device) return;
        const result = await TrezorConnect.applySettings({
            device: {
                path: device.path,
            },
            ...params,
        });
        if (result.success) {
            dispatch(notificationsActions.addToast({ type: 'settings-applied' }));
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.error.message }));
        }

        return result;
    };

type ChangePinThunkState = DeviceRootState;

export const changePinThunk =
    (params: Parameters<typeof TrezorConnect.changePin>[0] = {}, skipSuccessToast?: boolean) =>
    async (dispatch: Dispatch<UnknownAction>, getState: () => ChangePinThunkState) => {
        const device = selectSelectedDevice(getState());

        if (!device) return;

        const result = await TrezorConnect.changePin({
            device: {
                path: device.path,
            },
            ...params,
        });
        if (result.success) {
            if (!skipSuccessToast) {
                dispatch(notificationsActions.addToast({ type: 'pin-changed' }));
            }
        } else if (result.error.code === 'Failure_PinMismatch') {
            dispatch(openModal({ type: 'pin-mismatch' }));
        } else if (result.error.message.includes('string overflow')) {
            // this is a workaround for FW < 1.10.0
            // translate generic error from the device if the entered PIN is longer than 9 digits
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Please upgrade your firmware to enable extended PIN format.',
                }),
            );
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.error.message }));
        }
    };

type ChangeWipeCodeThunkState = DeviceRootState;

export const changeWipeCodeThunk =
    ({ remove }: Parameters<typeof TrezorConnect.changeWipeCode>[0] = {}) =>
    async (dispatch: Dispatch<UnknownAction>, getState: () => ChangeWipeCodeThunkState) => {
        const device = selectSelectedDevice(getState());

        if (!device) return;

        const result = await TrezorConnect.changeWipeCode({
            device: {
                path: device.path,
            },
            remove,
        });
        if (result.success) {
            dispatch(
                notificationsActions.addToast({
                    type: remove ? 'wipe-code-removed' : 'wipe-code-changed',
                }),
            );
        } else if (result.error.code === 'Failure_WipeCodeMismatch') {
            dispatch(openModal({ type: 'pin-mismatch' }));
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.error.message }));
        }
    };

type ResetDeviceThunkState = DeviceRootState & SuiteSettingsRootState & MessageSystemRootState;

type ResetDeviceThunkDeps = { services: ReportSecurityCheckDep };

export const resetDeviceThunk =
    (params: Parameters<typeof TrezorConnect.resetDevice>[0] = {}) =>
    async (
        dispatch: ThunkDispatch<ResetDeviceThunkState, ResetDeviceThunkDeps, UnknownAction>,
        getState: () => ResetDeviceThunkState,
    ) => {
        const device = selectSelectedDevice(getState());
        const isEntropyCheckEnabledInSettings = selectIsEntropyCheckEnabled(getState());
        const isEntropyCheckDisabledByMessageSystem = selectIsFeatureDisabled(
            getState(),
            Feature.entropyCheck,
        );

        if (device?.status === 'used' || device?.status === 'occupied') {
            const features = await TrezorConnect.getFeatures({ device: { path: device.path } });
            if (!features.success) {
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: 'Device is unreadable',
                    }),
                );

                return;
            }
            if (features.payload.initialized) {
                // Note that user gets stuck on this page. It's a rare edge case; a solution would have its own drawbacks.
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: 'This device has already been initialized',
                    }),
                );

                return;
            }
        }

        if (!device?.features) return;

        if (device.mode !== 'initialize') {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Device is not in initialization mode.',
                }),
            );

            return;
        }

        const defaults = {
            strength: DEFAULT_STRENGTH[device.features.internal_model],
            skip_backup: DEFAULT_SKIP_BACKUP,
            passphrase_protection: DEFAULT_PASSPHRASE_PROTECTION,
        };

        const isEntropyCheckEnabled =
            isEntropyCheckEnabledInSettings && !isEntropyCheckDisabledByMessageSystem;
        // Used only in tests! See deviceReducer for the property definition.
        const simulatedFailResult = selectSimulatedEntropyCheckFail(getState());

        const result = await TrezorConnect.resetDevice({
            ...defaults,
            ...params,
            device: {
                path: device.path,
            },
            entropy_check: isEntropyCheckEnabled,
        });

        if (isEntropyCheckEnabled) {
            if (simulatedFailResult) {
                dispatch(processEntropyCheckResultThunk({ device, result: simulatedFailResult }));

                return simulatedFailResult;
            }
            dispatch(processEntropyCheckResultThunk({ device, result }));
        }

        return result;
    };

type ChangeLanguageThunkState = DeviceRootState;

export const changeLanguageThunk = createThunk<
    Awaited<ReturnType<typeof TrezorConnect.changeLanguage>> | undefined,
    Parameters<typeof TrezorConnect.changeLanguage>[0],
    { state: ChangeLanguageThunkState }
>(`${FIRMWARE_MODULE_PREFIX}/update-firmware-language`, async (params, { dispatch, getState }) => {
    const device = selectSelectedDevice(getState());

    if (!device) return;

    const result = await TrezorConnect.changeLanguage({
        device: {
            path: device.path,
        },
        ...params,
    });

    if (result.success) {
        dispatch(notificationsActions.addToast({ type: 'firmware-language-changed' }));
    } else {
        // Different errors for desktop/Chrome/Firefox
        const isFetchError =
            result.error.code === ('ENOTFOUND' as ERRORS.ErrorCode) ||
            ['Failed to fetch', 'NetworkError when attempting to fetch resource.'].includes(
                result.error.message,
            );
        if (isFetchError) {
            dispatch(notificationsActions.addToast({ type: 'firmware-language-fetch-error' }));
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: result.error.message,
                }),
            );
        }
    }
});
