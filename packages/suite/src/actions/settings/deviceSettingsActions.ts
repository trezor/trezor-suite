import { FIRMWARE_MODULE_PREFIX } from '@suite-common/firmware';
import { Feature, selectIsFeatureDisabled } from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect, { ERRORS } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';

import * as modalActions from 'src/actions/suite/modalActions';
import { reportCheckFail } from 'src/components/suite/SecurityCheck/useReportDeviceCompromised';
import * as DEVICE from 'src/constants/suite/device';
import { Dispatch, GetState } from 'src/types/suite';

import { selectIsEntropyCheckEnabled } from '../../reducers/suite/suiteReducer';

export const applySettings =
    (params: Parameters<typeof TrezorConnect.applySettings>[0]) =>
    async (dispatch: Dispatch, getState: GetState) => {
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
            dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));
        }

        return result;
    };

export const changePin =
    (params: Parameters<typeof TrezorConnect.changePin>[0] = {}, skipSuccessToast?: boolean) =>
    async (dispatch: Dispatch, getState: GetState) => {
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
        } else if (result.payload.code === 'Failure_PinMismatch') {
            dispatch(modalActions.openModal({ type: 'pin-mismatch' }));
        } else if (result.payload.error.includes('string overflow')) {
            // this is a workaround for FW < 1.10.0
            // translate generic error from the device if the entered PIN is longer than 9 digits
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Please upgrade your firmware to enable extended PIN format.',
                }),
            );
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));
        }
    };

export const changeWipeCode =
    ({ remove }: Parameters<typeof TrezorConnect.changeWipeCode>[0] = {}) =>
    async (dispatch: Dispatch, getState: GetState) => {
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
        } else if (result.payload.code === 'Failure_WipeCodeMismatch') {
            dispatch(modalActions.openModal({ type: 'pin-mismatch' }));
        } else {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));
        }
    };

export const resetDevice =
    (params: Parameters<typeof TrezorConnect.resetDevice>[0] = {}) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const device = selectSelectedDevice(getState());
        const isEntropyCheckEnabled = selectIsEntropyCheckEnabled(getState());
        const isEntropyCheckDisabledByMessageSystem = selectIsFeatureDisabled(
            getState(),
            Feature.entropyCheck,
        );
        if (!device || !device.features) return;

        const defaults = {
            strength: DEVICE.DEFAULT_STRENGTH[device.features.internal_model],
            skip_backup: DEVICE.DEFAULT_SKIP_BACKUP,
            passphrase_protection: DEVICE.DEFAULT_PASSPHRASE_PROTECTION,
        };

        const result = await TrezorConnect.resetDevice({
            device: {
                path: device.path,
            },
            ...defaults,
            ...params,
            entropy_check: isEntropyCheckEnabled && !isEntropyCheckDisabledByMessageSystem,
        });

        if (!result.success) {
            dispatch(notificationsActions.addToast({ type: 'error', error: result.payload.error }));
            if (result.payload.code === 'Failure_EntropyCheck') {
                reportCheckFail('Entropy', {
                    model: device?.features?.internal_model,
                    revision: device?.features?.revision,
                    version: getFirmwareVersion(device),
                    vendor: device?.features?.fw_vendor,
                    error: result.payload.error,
                });
                // TODO: temporary exception to avoid false positives, see https://github.com/trezor/trezor-suite-private/issues/135
                if (result.payload.error !== 'device disconnected during action') {
                    dispatch(deviceActions.setEntropyCheckFail(device.id));
                }
            }
        }

        return result;
    };

export const changeLanguage = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/update-firmware-language`,
    async (params: Parameters<typeof TrezorConnect.changeLanguage>[0], { dispatch, getState }) => {
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
                result.payload.code === ('ENOTFOUND' as ERRORS.ErrorCode) ||
                ['Failed to fetch', 'NetworkError when attempting to fetch resource.'].includes(
                    result.payload.error,
                );
            if (isFetchError) {
                dispatch(notificationsActions.addToast({ type: 'firmware-language-fetch-error' }));
            } else {
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: result.payload.error,
                    }),
                );
            }
        }
    },
);
